import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Running smart reactivation triggers...");

    // Get dormant users (no verifications)
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const { data: activeUsers } = await supabase
      .from('verifications')
      .select('user_id')
      .not('user_id', 'is', null);

    const activeUserIds = new Set(activeUsers?.map(v => v.user_id) || []);
    const dormantUsers = allUsers?.users.filter(u => !activeUserIds.has(u.id)) || [];

    console.log(`Found ${dormantUsers.length} dormant users`);

    let triggersCreated = 0;

    // Trigger 1: New viral claims matching user profile
    for (const user of dormantUsers) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) continue;

      // Find recent viral claims (last 24 hours)
      const { data: recentClaims } = await supabase
        .from('viral_claims')
        .select('*')
        .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      if (recentClaims && recentClaims.length > 0) {
        // Create notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'viral_claim_match',
          message: `${recentClaims.length} new viral claims detected that match your interests!`,
          action_url: '/viral-claims',
          metadata: { claim_count: recentClaims.length }
        });

        // Track trigger
        await supabase.from('reengagement_tracking').insert({
          user_id: user.id,
          campaign_type: 'viral_claim_match',
          channel: 'notification',
          metadata: { claims: recentClaims.length }
        });

        triggersCreated++;
      }
    }

    // Trigger 2: Time-based nudges (7, 14, 21 days idle)
    for (const user of dormantUsers) {
      const signupDate = new Date(user.created_at);
      const daysSince = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

      let message = null;
      if (daysSince === 7) {
        message = "Your free trial is 77% complete. Try it before it expires!";
      } else if (daysSince === 14) {
        message = "Last chance! Your account becomes inactive in 16 days";
      } else if (daysSince === 21) {
        message = "Final reminder: Your trial expires in 9 days";
      }

      if (message) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'trial_reminder',
          message,
          action_url: '/verify',
          metadata: { days_since_signup: daysSince }
        });

        await supabase.from('reengagement_tracking').insert({
          user_id: user.id,
          campaign_type: `day_${daysSince}_nudge`,
          channel: 'notification',
          metadata: { days_idle: daysSince }
        });

        triggersCreated++;
      }
    }

    // Trigger 3: Platform milestones
    const { count: totalVerifications } = await supabase
      .from('verifications')
      .select('*', { count: 'exact', head: true });

    // Notify dormant users when we hit milestones (1000, 2000, etc.)
    if (totalVerifications && totalVerifications % 1000 === 0) {
      for (const user of dormantUsers.slice(0, 10)) { // Limit to prevent spam
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'milestone',
          message: `We just hit ${totalVerifications} total verifications! 🎉 Be part of the next milestone`,
          action_url: '/verify',
          metadata: { milestone: totalVerifications }
        });

        triggersCreated++;
      }
    }

    console.log(`Created ${triggersCreated} reactivation triggers`);

    return new Response(
      JSON.stringify({
        success: true,
        triggers_created: triggersCreated,
        dormant_users: dormantUsers.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in smart-reactivation-triggers:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
