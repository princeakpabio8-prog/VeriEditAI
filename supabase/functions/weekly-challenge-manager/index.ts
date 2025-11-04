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

    const { action } = await req.json();

    if (action === "create_weekly_challenge") {
      // Create new weekly challenge
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: challenge, error } = await supabase
        .from('weekly_challenges')
        .insert({
          week_start_date: weekStart.toISOString().split('T')[0],
          week_end_date: weekEnd.toISOString().split('T')[0],
          reward_type: 'credits',
          reward_value: 20,
          winner_count: 10,
          status: 'active',
          requirements: {
            min_verifications: 5,
            min_trust_score: 70
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Notify all users
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      
      for (const user of allUsers?.users || []) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'challenge',
          message: '🏆 New Weekly Challenge: First 10 to verify 5 claims win bonus credits!',
          action_url: '/verify',
          metadata: { challenge_id: challenge.id }
        });
      }

      console.log("Created weekly challenge:", challenge.id);

      return new Response(
        JSON.stringify({ success: true, challenge }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "update_progress") {
      // Update challenge participant progress
      const { data: activeChallenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('status', 'active')
        .single();

      if (!activeChallenge) {
        return new Response(
          JSON.stringify({ message: "No active challenge" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get all participants
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', activeChallenge.id);

      const participantIds = new Set(participants?.map(p => p.user_id) || []);

      // Update progress for each participant
      for (const userId of participantIds) {
        const weekStart = new Date(activeChallenge.week_start_date);
        const { count } = await supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', weekStart.toISOString());

        const { data: avgScore } = await supabase
          .from('verifications')
          .select('trust_score')
          .eq('user_id', userId)
          .gte('created_at', weekStart.toISOString());

        const avgTrustScore = avgScore && avgScore.length > 0
          ? avgScore.reduce((sum, v) => sum + (v.trust_score || 0), 0) / avgScore.length
          : 0;

        const completed = (count || 0) >= 5 && avgTrustScore >= 70;

        await supabase
          .from('challenge_participants')
          .update({
            progress: count || 0,
            completed_at: completed ? new Date().toISOString() : null
          })
          .eq('challenge_id', activeChallenge.id)
          .eq('user_id', userId);
      }

      console.log("Updated challenge progress for participants");

      return new Response(
        JSON.stringify({ success: true, updated: participantIds.size }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "award_winners") {
      // Award winners and close challenge
      const { data: activeChallenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('status', 'active')
        .single();

      if (!activeChallenge) {
        return new Response(
          JSON.stringify({ message: "No active challenge" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get top completers
      const { data: winners } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', activeChallenge.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true })
        .limit(activeChallenge.winner_count);

      if (winners && winners.length > 0) {
        // Mark as winners
        for (const winner of winners) {
          await supabase
            .from('challenge_participants')
            .update({ is_winner: true })
            .eq('id', winner.id);

          // Award bonus credits
          await supabase
            .from('profiles')
            .update({
              bonus_verifications: supabase.sql`bonus_verifications + ${activeChallenge.reward_value}`
            })
            .eq('user_id', winner.user_id);

          // Notify winner
          await supabase.from('notifications').insert({
            user_id: winner.user_id,
            type: 'challenge_won',
            message: `🎉 You won this week's challenge! ${activeChallenge.reward_value} bonus credits added`,
            action_url: '/dashboard',
            metadata: { challenge_id: activeChallenge.id }
          });
        }
      }

      // Close challenge
      await supabase
        .from('weekly_challenges')
        .update({ status: 'completed' })
        .eq('id', activeChallenge.id);

      console.log(`Awarded ${winners?.length || 0} winners`);

      return new Response(
        JSON.stringify({ success: true, winners: winners?.length || 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in weekly-challenge-manager:", error);
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
