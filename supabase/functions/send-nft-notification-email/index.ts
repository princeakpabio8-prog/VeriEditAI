import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NFTNotificationRequest {
  userId: string;
  type: "nft_sold" | "royalty_earned" | "nft_listed";
  tokenId: string;
  amount?: number;
  listingPrice?: number;
  platform?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, tokenId, amount, listingPrice, platform = "OpenSea" }: NFTNotificationRequest = await req.json();

    // Get user profile and preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email_preferences")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has enabled NFT notifications
    const emailPrefs = profile.email_preferences || {};
    if (!emailPrefs.nft_sales_notifications && type === "nft_sold") {
      console.log("User has disabled NFT sale notifications");
      return new Response(JSON.stringify({ status: "skipped" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (!authUser.user?.email) {
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "nft_sold":
        subject = `🎉 Your Truth Badge #${tokenId} Sold!`;
        htmlContent = `
          <h1>Congratulations ${profile.full_name}!</h1>
          <p>Your Truth Badge #${tokenId} has been sold on ${platform}.</p>
          <h2>Royalty Earned: ${amount?.toFixed(4)} MATIC</h2>
          <p>You've earned a 5% royalty from this secondary sale.</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")}/royalty-dashboard">View Your Royalty Dashboard</a></p>
          <p>Keep creating verified content to earn more!</p>
        `;
        break;

      case "nft_listed":
        subject = `📋 Your Truth Badge #${tokenId} Listed for Sale`;
        htmlContent = `
          <h1>Listing Notification</h1>
          <p>Your Truth Badge #${tokenId} has been listed for sale on ${platform}.</p>
          <h2>Listing Price: ${listingPrice?.toFixed(4)} MATIC</h2>
          <p><a href="${Deno.env.get("SUPABASE_URL")}/nft/marketplace">View Marketplace</a></p>
        `;
        break;

      case "royalty_earned":
        subject = `💰 New Royalty Earned!`;
        htmlContent = `
          <h1>Royalty Payment Received</h1>
          <p>You've earned ${amount?.toFixed(4)} MATIC in royalties from Truth Badge #${tokenId}.</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")}/royalty-dashboard">View Dashboard</a></p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "VeriEdit NFT <nft@veriedit.com>",
      to: [authUser.user.email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ status: "sent", emailId: emailResponse.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending NFT notification email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
