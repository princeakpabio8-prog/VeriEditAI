import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { tx_ref, flw_ref } = await req.json();

    // Verify payment with Flutterwave V4 API
    const clientId = Deno.env.get("FLUTTERWAVE_CLIENT_ID");
    const clientSecret = Deno.env.get("FLUTTERWAVE_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      throw new Error("Flutterwave V4 credentials not configured");
    }

    const flutterwaveResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${flw_ref}/verify`,
      {
        method: "GET",
        headers: {
          "ClientId": clientId,
          "Authorization": `Bearer ${clientSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verificationData = await flutterwaveResponse.json();
    
    if (verificationData.status !== "success" || verificationData.data.status !== "successful") {
      throw new Error("Payment verification failed");
    }

    const paymentData = verificationData.data;

    // Use service role key to update database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update payment record
    const { data: payment, error: paymentError } = await supabaseService
      .from("payments")
      .update({
        flw_ref: paymentData.flw_ref,
        status: "successful",
        payment_method: paymentData.payment_type,
        metadata: {
          flutterwave_data: paymentData,
          verified_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq("tx_ref", tx_ref)
      .eq("user_id", user.id)
      .select()
      .single();

    if (paymentError) {
      console.error("Payment update error:", paymentError);
      throw new Error("Failed to update payment record");
    }

    // Calculate expiry date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Upgrade user subscription
    const { data: upgradeResult, error: upgradeError } = await supabaseService
      .rpc("upgrade_user_subscription", {
        user_uuid: user.id,
        plan: payment.plan,
        payment_uuid: payment.id,
        expires_date: expiryDate.toISOString()
      });

    if (upgradeError) {
      console.error("Subscription upgrade error:", upgradeError);
      throw new Error("Failed to upgrade subscription");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified and subscription upgraded",
      payment_id: payment.id,
      plan: payment.plan
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});