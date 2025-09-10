import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const userId = session.metadata?.user_id;

        if (userId && customerId) {
          console.log("Processing checkout completed for user:", userId);
          
          // Get customer email
          const customer = await stripe.customers.retrieve(customerId);
          const email = (customer as Stripe.Customer).email;

          if (email) {
            await supabaseClient.from("subscribers").upsert({
              user_id: userId,
              email: email,
              stripe_customer_id: customerId,
              subscribed: true,
              subscription_tier: "pro", // Default to pro for new subscriptions
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });

            await supabaseClient.from("profiles").update({
              subscription_tier: "pro",
            }).eq("user_id", userId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Processing subscription updated for customer:", customerId);

        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;

        if (email) {
          const subscriptionTier = subscription.status === "active" ? "pro" : "free";
          const subscribed = subscription.status === "active";
          const subscriptionEnd = subscription.status === "active" 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          await supabaseClient.from("subscribers").upsert({
            email: email,
            stripe_customer_id: customerId,
            subscribed: subscribed,
            subscription_tier: subscriptionTier,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

          // Update profiles table too
          const { data: subscriber } = await supabaseClient
            .from("subscribers")
            .select("user_id")
            .eq("email", email)
            .single();

          if (subscriber?.user_id) {
            await supabaseClient.from("profiles").update({
              subscription_tier: subscriptionTier,
            }).eq("user_id", subscriber.user_id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Processing subscription deleted for customer:", customerId);

        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;

        if (email) {
          await supabaseClient.from("subscribers").upsert({
            email: email,
            stripe_customer_id: customerId,
            subscribed: false,
            subscription_tier: "free",
            subscription_end: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

          // Update profiles table too
          const { data: subscriber } = await supabaseClient
            .from("subscribers")
            .select("user_id")
            .eq("email", email)
            .single();

          if (subscriber?.user_id) {
            await supabaseClient.from("profiles").update({
              subscription_tier: "free",
            }).eq("user_id", subscriber.user_id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});