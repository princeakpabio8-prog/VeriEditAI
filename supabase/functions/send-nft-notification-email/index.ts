import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NFTNotificationRequest {
  user_id: string;
  event_type: "sale" | "listing" | "transfer";
  token_id: string;
  sale_price?: number;
  royalty_amount?: number;
  listing_price?: number;
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
    const {
      user_id,
      event_type,
      token_id,
      sale_price,
      royalty_amount,
      listing_price,
    }: NFTNotificationRequest = await req.json();

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    
    if (!user?.email) {
      throw new Error("User email not found");
    }

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .single();

    const userName = profile?.full_name || user.email.split("@")[0];

    let subject = "";
    let html = "";

    switch (event_type) {
      case "sale":
        subject = `🎉 Your Truth Badge #${token_id} Sold!`;
        html = `
          <h1>Congratulations, ${userName}!</h1>
          <p>Your VeriEdit Truth Badge #${token_id} has been sold on OpenSea!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Sale Details</h2>
            <p><strong>Sale Price:</strong> ${sale_price?.toFixed(4)} MATIC</p>
            <p><strong>Your Royalty:</strong> ${royalty_amount?.toFixed(4)} MATIC (5%)</p>
            <p><strong>Platform:</strong> OpenSea</p>
          </div>
          
          <p>Your royalty earnings have been recorded and will be available for claim soon.</p>
          
          <p style="margin-top: 30px;">
            <a href="${Deno.env.get("SITE_URL")}/royalty-dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Royalty Dashboard
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
            Best regards,<br>
            The VeriEdit Team
          </p>
        `;
        break;

      case "listing":
        subject = `📝 Your Truth Badge #${token_id} Listed`;
        html = `
          <h1>Badge Listed, ${userName}</h1>
          <p>Your VeriEdit Truth Badge #${token_id} has been listed on OpenSea.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Listing Details</h2>
            <p><strong>Listing Price:</strong> ${listing_price?.toFixed(4)} MATIC</p>
            <p><strong>Platform:</strong> OpenSea</p>
          </div>
          
          <p>You'll receive a notification when it sells.</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
            Best regards,<br>
            The VeriEdit Team
          </p>
        `;
        break;

      case "transfer":
        subject = `🔄 Your Truth Badge #${token_id} Transferred`;
        html = `
          <h1>Badge Transferred, ${userName}</h1>
          <p>Your VeriEdit Truth Badge #${token_id} has been transferred to a new owner.</p>
          
          <p>You'll continue to earn 5% royalties on all future sales of this badge.</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
            Best regards,<br>
            The VeriEdit Team
          </p>
        `;
        break;
    }

    const { error } = await resend.emails.send({
      from: "VeriEdit <notifications@resend.dev>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Email sent to ${user.email} for ${event_type}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Email notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
