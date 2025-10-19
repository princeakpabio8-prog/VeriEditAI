import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OpenSeaWebhookPayload {
  event_type: string;
  sent_at: string;
  payload: {
    event_id: string;
    chain: string;
    item: {
      nft: {
        contract: string;
        identifier: string;
      };
    };
    sale_price?: {
      value: string;
      currency: string;
    };
    listing_price?: {
      value: string;
      currency: string;
    };
    from_account?: {
      address: string;
    };
    to_account?: {
      address: string;
    };
    transaction?: {
      hash: string;
    };
    listing?: any;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payload: OpenSeaWebhookPayload = await req.json();
    console.log("📦 OpenSea webhook received:", payload.event_type);

    const { event_type, payload: eventPayload } = payload;
    const eventId = eventPayload.event_id;
    const tokenId = eventPayload.item.nft.identifier;

    // Check for duplicate event (replay protection)
    const { data: existingEvent } = await supabase
      .from("nft_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .single();

    if (existingEvent) {
      console.log("⚠️ Duplicate event ignored:", eventId);
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store webhook event
    await supabase.from("nft_webhook_events").insert({
      event_id: eventId,
      event_type: event_type,
      token_id: tokenId,
      payload: eventPayload,
      processed: false,
    });

    // Find badge owner
    const { data: badge } = await supabase
      .from("nft_badges")
      .select("user_id, verification_id, claim_text")
      .eq("token_id", tokenId)
      .single();

    if (!badge) {
      console.log("⚠️ Badge not found for token:", tokenId);
      return new Response(JSON.stringify({ success: true, badge_not_found: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different event types
    switch (event_type) {
      case "item_sold":
        await handleItemSold(supabase, badge, eventPayload);
        break;
      case "item_listed":
        await handleItemListed(supabase, badge, eventPayload);
        break;
      case "item_transferred":
        await handleItemTransferred(supabase, badge, eventPayload);
        break;
      default:
        console.log("ℹ️ Unhandled event type:", event_type);
    }

    // Mark event as processed
    await supabase
      .from("nft_webhook_events")
      .update({ processed: true })
      .eq("event_id", eventId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ OpenSea webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleItemSold(supabase: any, badge: any, eventPayload: any) {
  const tokenId = eventPayload.item.nft.identifier;
  const salePrice = parseFloat(eventPayload.sale_price?.value || "0") / 1e18; // Convert from wei
  const royaltyAmount = salePrice * 0.05; // 5% royalty
  const txHash = eventPayload.transaction?.hash;
  const sellerAddress = eventPayload.from_account?.address;
  const buyerAddress = eventPayload.to_account?.address;

  console.log(`💰 NFT Sold - Token #${tokenId} for ${salePrice} MATIC`);

  // Record royalty earning
  await supabase.from("nft_royalty_earnings").insert({
    token_id: tokenId,
    sale_price: salePrice,
    royalty_amount: royaltyAmount,
    royalty_percentage: 5,
    seller_address: sellerAddress,
    buyer_address: buyerAddress,
    transaction_hash: txHash,
    platform: "opensea",
    claimed: false,
  });

  // Create notification for badge owner
  await supabase.from("notifications").insert({
    user_id: badge.user_id,
    type: "nft_sold",
    message: `Your Truth Badge #${tokenId} sold for ${salePrice.toFixed(4)} MATIC! You earned ${royaltyAmount.toFixed(4)} MATIC in royalties.`,
    action_url: `/nft/marketplace?badge=${tokenId}`,
    metadata: {
      token_id: tokenId,
      sale_price: salePrice,
      royalty_amount: royaltyAmount,
      buyer: buyerAddress,
      platform: "opensea",
      transaction_hash: txHash,
    },
  });

  // Send email notification (if enabled)
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_preferences")
    .eq("user_id", badge.user_id)
    .single();

  if (profile?.email_preferences?.nft_sales_notifications !== false) {
    await supabase.functions.invoke("send-nft-notification-email", {
      body: {
        user_id: badge.user_id,
        event_type: "sale",
        token_id: tokenId,
        sale_price: salePrice,
        royalty_amount: royaltyAmount,
      },
    });
  }

  console.log(`✅ Sale processed for badge owner ${badge.user_id}`);
}

async function handleItemListed(supabase: any, badge: any, eventPayload: any) {
  const tokenId = eventPayload.item.nft.identifier;
  const listingPrice = parseFloat(eventPayload.listing_price?.value || "0") / 1e18;

  console.log(`📝 NFT Listed - Token #${tokenId} for ${listingPrice} MATIC`);

  // Create notification
  await supabase.from("notifications").insert({
    user_id: badge.user_id,
    type: "nft_listed",
    message: `Your Truth Badge #${tokenId} was listed for ${listingPrice.toFixed(4)} MATIC`,
    action_url: `/nft/marketplace?badge=${tokenId}`,
    metadata: {
      token_id: tokenId,
      listing_price: listingPrice,
      platform: "opensea",
    },
  });

  console.log(`✅ Listing notification sent to ${badge.user_id}`);
}

async function handleItemTransferred(supabase: any, badge: any, eventPayload: any) {
  const tokenId = eventPayload.item.nft.identifier;
  const fromAddress = eventPayload.from_account?.address;
  const toAddress = eventPayload.to_account?.address;

  console.log(`🔄 NFT Transferred - Token #${tokenId}`);

  // Only notify if it's not part of a sale (sale events are handled separately)
  if (!eventPayload.sale_price) {
    await supabase.from("notifications").insert({
      user_id: badge.user_id,
      type: "nft_transferred",
      message: `Your Truth Badge #${tokenId} was transferred`,
      action_url: `/nft/marketplace?badge=${tokenId}`,
      metadata: {
        token_id: tokenId,
        from: fromAddress,
        to: toAddress,
        platform: "opensea",
      },
    });
  }
}
