import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openseaWebhookSecret = Deno.env.get("OPENSEA_WEBHOOK_SECRET");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-opensea-signature",
};

interface OpenSeaEvent {
  event_type: string;
  sent_at: string;
  payload: {
    item: {
      nft: {
        identifier: string; // token_id
        contract: string;
      };
      permalink: string;
    };
    sale_price?: string;
    listing_price?: string;
    from_account?: { address: string };
    to_account?: { address: string };
    transaction?: { hash: string };
    event_timestamp: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventId = req.headers.get("x-opensea-event-id");
    const signature = req.headers.get("x-opensea-signature");

    if (!eventId) {
      console.error("Missing event ID");
      return new Response(JSON.stringify({ error: "Missing event ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate event (replay protection)
    const { data: existingEvent } = await supabase
      .from("nft_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .single();

    if (existingEvent) {
      console.log(`Event ${eventId} already processed`);
      return new Response(JSON.stringify({ status: "already_processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TODO: Verify signature when secret is configured
    // if (openseaWebhookSecret && signature) {
    //   const isValid = await verifySignature(req.body, signature, openseaWebhookSecret);
    //   if (!isValid) {
    //     return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    //   }
    // }

    const event: OpenSeaEvent = await req.json();
    console.log(`Processing OpenSea event: ${event.event_type}`, event);

    const tokenId = event.payload.item.nft.identifier;

    // Store webhook event
    await supabase.from("nft_webhook_events").insert({
      event_id: eventId,
      event_type: event.event_type,
      token_id: tokenId,
      payload: event,
      processed: false,
    });

    // Process different event types
    switch (event.event_type) {
      case "item_sold":
        await handleItemSold(event, tokenId);
        break;
      case "item_listed":
        await handleItemListed(event, tokenId);
        break;
      case "item_transferred":
        await handleItemTransferred(event, tokenId);
        break;
      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    // Mark event as processed
    await supabase
      .from("nft_webhook_events")
      .update({ processed: true })
      .eq("event_id", eventId);

    return new Response(JSON.stringify({ status: "processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OpenSea webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleItemSold(event: OpenSeaEvent, tokenId: string) {
  console.log(`Handling item sold for token ${tokenId}`);

  // Get badge owner
  const { data: badge } = await supabase
    .from("nft_badges")
    .select("user_id, verification_id, claim_text")
    .eq("token_id", tokenId)
    .single();

  if (!badge) {
    console.error(`Badge not found for token ${tokenId}`);
    return;
  }

  const salePrice = parseFloat(event.payload.sale_price || "0");
  const royaltyPercentage = 5; // 5% from TruthBadgeV2 contract
  const royaltyAmount = salePrice * (royaltyPercentage / 100);

  // Record royalty earning
  const { error: royaltyError } = await supabase
    .from("nft_royalty_earnings")
    .insert({
      token_id: tokenId,
      sale_price: salePrice,
      royalty_amount: royaltyAmount,
      royalty_percentage: royaltyPercentage,
      seller_address: event.payload.from_account?.address || "",
      buyer_address: event.payload.to_account?.address || "",
      transaction_hash: event.payload.transaction?.hash || "",
      platform: "opensea",
      claimed: false,
    });

  if (royaltyError) {
    console.error("Error recording royalty:", royaltyError);
  }

  // Create notification
  await supabase.from("notifications").insert({
    user_id: badge.user_id,
    type: "nft_sold",
    message: `Your Truth Badge #${tokenId} sold for ${salePrice.toFixed(4)} MATIC! Earned ${royaltyAmount.toFixed(4)} MATIC in royalties.`,
    action_url: `/nft/marketplace?badge=${tokenId}`,
    metadata: {
      token_id: tokenId,
      sale_price: salePrice,
      royalty_amount: royaltyAmount,
      platform: "opensea",
      transaction_hash: event.payload.transaction?.hash,
    },
  });

  console.log(`Created sale notification for user ${badge.user_id}`);
}

async function handleItemListed(event: OpenSeaEvent, tokenId: string) {
  console.log(`Handling item listed for token ${tokenId}`);

  const { data: badge } = await supabase
    .from("nft_badges")
    .select("user_id")
    .eq("token_id", tokenId)
    .single();

  if (!badge) return;

  const listingPrice = parseFloat(event.payload.listing_price || "0");

  // Update or create listing record
  await supabase.from("nft_marketplace_listings").upsert({
    token_id: tokenId,
    badge_id: null, // Will be updated by trigger if needed
    seller_address: event.payload.from_account?.address || "",
    listing_price: listingPrice,
    currency: "MATIC",
    platform: "opensea",
    listing_url: event.payload.item.permalink,
    is_active: true,
  });

  // Create notification
  await supabase.from("notifications").insert({
    user_id: badge.user_id,
    type: "nft_listed",
    message: `Your Truth Badge #${tokenId} listed for ${listingPrice.toFixed(4)} MATIC on OpenSea`,
    action_url: event.payload.item.permalink,
    metadata: {
      token_id: tokenId,
      listing_price: listingPrice,
      platform: "opensea",
    },
  });

  console.log(`Created listing notification for user ${badge.user_id}`);
}

async function handleItemTransferred(event: OpenSeaEvent, tokenId: string) {
  console.log(`Handling item transferred for token ${tokenId}`);

  // Just log for now - could track ownership changes
  await supabase.from("nft_marketplace_listings").update({
    is_active: false,
  }).eq("token_id", tokenId);
}
