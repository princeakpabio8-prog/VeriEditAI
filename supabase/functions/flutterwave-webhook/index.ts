import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { HmacSha256 } from "https://deno.land/std@0.190.0/crypto/hmac.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, verif-hash",
};

interface FlutterwaveEvent {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type?: string;
    customer?: {
      email: string;
      name: string;
    };
    meta?: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  // Initialize Supabase client with service role key
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let payload: any;
  let signature: string | null = null;
  let logId: string | null = null;

  try {
    // Get request body and signature
    const body = await req.text();
    payload = JSON.parse(body);
    signature = req.headers.get("verif-hash");

    console.log("Webhook received:", {
      event: payload.event,
      tx_ref: payload.data?.tx_ref,
      signature: signature ? "present" : "missing"
    });

    // Log the webhook attempt
    const { data: logEntry, error: logError } = await supabaseService
      .from("payment_logs")
      .insert({
        payload: payload,
        signature: signature,
        event_type: payload.event,
        tx_ref: payload.data?.tx_ref,
        status: "received"
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to log webhook:", logError);
    } else {
      logId = logEntry.id;
    }

    // Verify signature
    if (!signature) {
      await updateLog(supabaseService, logId, "invalid_signature", "Missing verif-hash header");
      return new Response("Unauthorized: Missing signature", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const flutterwaveSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecret) {
      console.error("Flutterwave secret key not configured");
      await updateLog(supabaseService, logId, "failed", "Server configuration error");
      return new Response("Server configuration error", { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Verify webhook signature
    const expectedSignature = await generateSignature(body, flutterwaveSecret);
    if (signature !== expectedSignature) {
      console.error("Invalid signature:", { received: signature, expected: expectedSignature });
      await updateLog(supabaseService, logId, "invalid_signature", "Signature verification failed");
      return new Response("Unauthorized: Invalid signature", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    console.log("Signature verified successfully");

    // Process the webhook event
    const result = await processWebhookEvent(supabaseService, payload as FlutterwaveEvent);
    
    if (result.success) {
      await updateLog(supabaseService, logId, "processed", null);
      console.log("Webhook processed successfully:", result.message);
      
      return new Response(JSON.stringify({ 
        status: "success", 
        message: result.message 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      await updateLog(supabaseService, logId, "failed", result.error);
      console.error("Webhook processing failed:", result.error);
      
      return new Response(JSON.stringify({ 
        status: "error", 
        message: result.error 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error("Webhook error:", error);
    
    if (logId) {
      await updateLog(supabaseService, logId, "failed", error.message);
    }

    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function generateSignature(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function updateLog(
  supabase: any, 
  logId: string | null, 
  status: string, 
  errorMessage: string | null
) {
  if (!logId) return;
  
  try {
    await supabase
      .from("payment_logs")
      .update({
        status: status,
        error_message: errorMessage
      })
      .eq("id", logId);
  } catch (error) {
    console.error("Failed to update log:", error);
  }
}

async function processWebhookEvent(
  supabase: any, 
  event: FlutterwaveEvent
): Promise<{ success: boolean; message?: string; error?: string }> {
  
  const { event: eventType, data } = event;
  const { tx_ref, id: flw_id, amount, currency, status } = data;

  console.log("Processing event:", { eventType, tx_ref, status });

  // Handle successful payment events
  if (eventType === "charge.completed" && status === "successful") {
    return await handleSuccessfulPayment(supabase, {
      tx_ref,
      flw_id: flw_id.toString(),
      amount,
      currency,
      status,
      payment_type: data.payment_type
    });
  }

  // Handle failed payment events
  if (eventType === "charge.completed" && status === "failed") {
    return await handleFailedPayment(supabase, {
      tx_ref,
      flw_id: flw_id.toString(),
      status,
      reason: "Payment failed"
    });
  }

  // Handle other payment events
  if (eventType === "payment.successful") {
    return await handleSuccessfulPayment(supabase, {
      tx_ref,
      flw_id: flw_id.toString(),
      amount,
      currency,
      status: "successful",
      payment_type: data.payment_type
    });
  }

  console.log("Unhandled event type:", eventType);
  return { 
    success: true, 
    message: `Event ${eventType} acknowledged but not processed` 
  };
}

async function handleSuccessfulPayment(
  supabase: any,
  paymentData: {
    tx_ref: string;
    flw_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_type?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  
  try {
    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, user_id, plan")
      .eq("tx_ref", paymentData.tx_ref)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return { 
        success: false, 
        error: `Payment record not found for tx_ref: ${paymentData.tx_ref}` 
      };
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "successful",
        flw_id: paymentData.flw_id,
        metadata: {
          flutterwave_data: paymentData,
          processed_at: new Date().toISOString()
        }
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return { 
        success: false, 
        error: "Failed to update payment record" 
      };
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    // Set subscription duration based on plan
    if (payment.plan === "pro") {
      endDate.setMonth(endDate.getMonth() + 1); // 30 days
    } else if (payment.plan === "enterprise") {
      endDate.setFullYear(endDate.getFullYear() + 1); // 365 days
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Default 30 days
    }

    // Update or insert subscription
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: payment.user_id,
        plan: payment.plan,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        active: true,
        auto_renew: true, // Enable auto-renewal for webhook payments
        last_payment_id: payment.id
      }, {
        onConflict: "user_id"
      });

    if (subscriptionError) {
      console.error("Failed to update subscription:", subscriptionError);
      return { 
        success: false, 
        error: "Failed to update subscription" 
      };
    }

    // Update profile if exists
    await supabase
      .from("profiles")
      .update({
        subscription_status: payment.plan,
        subscription_expires_at: endDate.toISOString(),
        payment_method: paymentData.payment_type || "flutterwave"
      })
      .eq("user_id", payment.user_id);

    console.log("Successfully processed payment:", {
      user_id: payment.user_id,
      plan: payment.plan,
      amount: paymentData.amount
    });

    return { 
      success: true, 
      message: `Successfully activated ${payment.plan} subscription for user ${payment.user_id}` 
    };

  } catch (error) {
    console.error("Error processing successful payment:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function handleFailedPayment(
  supabase: any,
  paymentData: {
    tx_ref: string;
    flw_id: string;
    status: string;
    reason: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  
  try {
    // Find and update the payment record
    const { data: payment, error: updateError } = await supabase
      .from("payments")
      .update({
        status: "failed",
        flw_id: paymentData.flw_id,
        metadata: {
          failure_reason: paymentData.reason,
          failed_at: new Date().toISOString()
        }
      })
      .eq("tx_ref", paymentData.tx_ref)
      .select("user_id")
      .single();

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return { 
        success: false, 
        error: "Failed to update payment record" 
      };
    }

    console.log("Successfully processed failed payment:", {
      tx_ref: paymentData.tx_ref,
      user_id: payment?.user_id
    });

    return { 
      success: true, 
      message: `Payment failure recorded for tx_ref: ${paymentData.tx_ref}` 
    };

  } catch (error) {
    console.error("Error processing failed payment:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}