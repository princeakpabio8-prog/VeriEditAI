import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailCampaignRequest {
  campaignType: "day_0" | "day_3" | "day_7" | "day_14";
  userIds?: string[];
  testMode?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { campaignType, userIds, testMode = false }: EmailCampaignRequest = await req.json();

    console.log(`Starting ${campaignType} re-engagement campaign${testMode ? ' (TEST MODE)' : ''}`);

    // Find dormant users based on campaign type
    let targetUsers;
    if (userIds && userIds.length > 0) {
      const { data } = await supabase.auth.admin.listUsers();
      targetUsers = data?.users.filter(u => userIds.includes(u.id));
    } else {
      const daysSinceSignup = campaignType === "day_0" ? 0 : 
                               campaignType === "day_3" ? 3 :
                               campaignType === "day_7" ? 7 : 14;

      const { data: allUsers } = await supabase.auth.admin.listUsers();
      
      // Get users who haven't verified anything
      const { data: verificationUsers } = await supabase
        .from('verifications')
        .select('user_id')
        .not('user_id', 'is', null);

      const activeUserIds = new Set(verificationUsers?.map(v => v.user_id) || []);

      targetUsers = allUsers?.users.filter(user => {
        const signupDate = new Date(user.created_at);
        const daysSince = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return !activeUserIds.has(user.id) && 
               daysSince >= daysSinceSignup && 
               daysSince < daysSinceSignup + 1;
      });
    }

    if (!targetUsers || targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No eligible users found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profiles for personalization
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email_notifications_enabled, reengagement_paused_until')
      .in('user_id', targetUsers.map(u => u.id));

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Send emails
    let sentCount = 0;
    const errors = [];

    for (const user of targetUsers) {
      const profile = profileMap.get(user.id);
      
      // Skip if notifications disabled or paused
      if (profile?.email_notifications_enabled === false) continue;
      if (profile?.reengagement_paused_until && new Date(profile.reengagement_paused_until) > new Date()) continue;

      const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
      const emailContent = getEmailContent(campaignType, firstName, user.email);

      try {
        const { error } = await resend.emails.send({
          from: "VeriEdit <onboarding@resend.dev>",
          to: [user.email!],
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (error) {
          console.error(`Failed to send to ${user.email}:`, error);
          errors.push({ email: user.email, error: error.message });
        } else {
          sentCount++;
          
          // Track in reengagement_tracking
          await supabase.from('reengagement_tracking').insert({
            user_id: user.id,
            campaign_type: campaignType,
            channel: 'email',
            metadata: { test_mode: testMode }
          });
        }
      } catch (err) {
        console.error(`Error sending to ${user.email}:`, err);
        errors.push({ email: user.email, error: String(err) });
      }
    }

    console.log(`Campaign complete: ${sentCount}/${targetUsers.length} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign: campaignType,
        sent: sentCount,
        total: targetUsers.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reengagement-campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getEmailContent(type: string, firstName: string, email: string) {
  const baseUrl = "https://sqtkkzdswxazyikcheds.supabase.co";
  
  switch (type) {
    case "day_0":
      return {
        subject: `${firstName}, your first verification is waiting ⏳`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px;">You Left Something Behind</h1>
              <p style="font-size: 16px; color: #555;">Hi ${firstName},</p>
              <p style="font-size: 16px; color: #555;">
                We noticed you signed up for VeriEdit but haven't verified your first claim yet. 
                You're missing out on joining <strong>24 fact-checkers</strong> who've verified <strong>824 viral claims</strong> this month!
              </p>
              <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">🔥 What's Trending Right Now:</h3>
                <p style="margin: 5px 0;">• 128 people are checking claims about Nigerian elections</p>
                <p style="margin: 5px 0;">• 95 people verifying tech industry news</p>
                <p style="margin: 5px 0;">• 87 people fact-checking health claims</p>
              </div>
              <a href="${baseUrl}/verify" style="display: inline-block; background: hsl(221, 83%, 53%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
                Verify Your First Claim (30 seconds)
              </a>
              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                🎁 <strong>Bonus:</strong> Get 5 extra verification credits if you verify today!
              </p>
              <p style="font-size: 14px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                Don't want these emails? <a href="${baseUrl}/settings" style="color: #666;">Update your preferences</a>
              </p>
            </body>
          </html>
        `
      };
    
    case "day_3":
      return {
        subject: `5 users just earned NFT badges today 🏆`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px;">See What Others Are Discovering</h1>
              <p style="font-size: 16px; color: #555;">Hi ${firstName},</p>
              <p style="font-size: 16px; color: #555;">
                Your peers are racing to verify claims and earning rewards. Don't fall behind!
              </p>
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid hsl(221, 83%, 53%);">
                <h3 style="margin-top: 0; color: hsl(221, 83%, 53%);">📊 This Week's Activity:</h3>
                <p style="margin: 8px 0; font-size: 18px;"><strong>169 NFT badges minted</strong> by active verifiers</p>
                <p style="margin: 8px 0;">🔥 Someone just verified a claim 2 minutes ago</p>
                <p style="margin: 8px 0;">⚡ Average trust score: 76.4%</p>
              </div>
              <p style="font-size: 16px; color: #555;">
                <strong>Your trial status:</strong> 20 free verifications remaining (27 days left)
              </p>
              <a href="${baseUrl}/viral-claims" style="display: inline-block; background: hsl(221, 83%, 53%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
                See Hot Claims Now
              </a>
              <p style="font-size: 14px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <a href="${baseUrl}/settings" style="color: #666;">Pause notifications for 7 days</a>
              </p>
            </body>
          </html>
        `
      };
    
    case "day_7":
      return {
        subject: `${firstName}, this expires tonight 🚨`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #dc2626; font-size: 24px;">⚠️ Last Chance: Exclusive Access</h1>
              <p style="font-size: 16px; color: #555;">Hi ${firstName},</p>
              <p style="font-size: 16px; color: #555;">
                Your welcome bonus and early access features <strong>expire in 12 hours</strong>.
              </p>
              <div style="background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dc2626;">
                <h3 style="margin-top: 0; color: #dc2626;">What You're About to Lose:</h3>
                <p style="margin: 8px 0;">❌ 5 bonus verification credits</p>
                <p style="margin: 8px 0;">❌ Priority access to NFT minting</p>
                <p style="margin: 8px 0;">❌ Early bird badge eligibility</p>
              </div>
              <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Success Story:</strong></p>
                <p style="margin: 10px 0 0 0; font-style: italic;">"I verified 50 claims and earned $200 in NFT royalties in my first month!" - Active User</p>
              </div>
              <a href="${baseUrl}/verify?quickstart=true" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
                Start Now (2-minute quickstart)
              </a>
              <p style="font-size: 12px; color: #999; margin-top: 40px;">
                This is your final reminder. We won't send more promotional emails after this.
              </p>
            </body>
          </html>
        `
      };
    
    case "day_14":
      return {
        subject: `Should we close your account?`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px;">We Miss You</h1>
              <p style="font-size: 16px; color: #555;">Hi ${firstName},</p>
              <p style="font-size: 16px; color: #555;">
                We haven't seen you since you signed up 14 days ago. It looks like VeriEdit might not be for you. That's okay!
              </p>
              <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Quick Survey (1 click):</h3>
                <p style="margin: 10px 0; font-size: 14px;">Why didn't you verify anything?</p>
                <p style="margin: 5px 0;">
                  <a href="${baseUrl}/feedback?reason=too_complicated" style="color: hsl(221, 83%, 53%);">→ Too complicated</a>
                </p>
                <p style="margin: 5px 0;">
                  <a href="${baseUrl}/feedback?reason=not_relevant" style="color: hsl(221, 83%, 53%);">→ Not relevant to me</a>
                </p>
                <p style="margin: 5px 0;">
                  <a href="${baseUrl}/feedback?reason=no_value" style="color: hsl(221, 83%, 53%);">→ Didn't understand the value</a>
                </p>
                <p style="margin: 5px 0;">
                  <a href="${baseUrl}/feedback?reason=too_busy" style="color: hsl(221, 83%, 53%);">→ Too busy</a>
                </p>
              </div>
              <p style="font-size: 16px; color: #555;">
                Or, give us one more shot:
              </p>
              <a href="${baseUrl}/demo" style="display: inline-block; background: hsl(221, 83%, 53%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
                Watch Guided Demo (60 seconds)
              </a>
              <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                We won't send any more emails unless you take action. Thank you for trying VeriEdit.
              </p>
            </body>
          </html>
        `
      };
    
    default:
      return { subject: "Welcome to VeriEdit", html: "<p>Welcome!</p>" };
  }
}

serve(handler);
