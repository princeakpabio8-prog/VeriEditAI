import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderboardPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'all_time';
  start: Date;
  end: Date;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🏆 Starting leaderboard update...');

    const today = new Date();
    
    // Define periods
    const periods: LeaderboardPeriod[] = [
      {
        type: 'daily',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      },
      {
        type: 'weekly',
        start: (() => {
          const d = new Date(today);
          const day = d.getDay();
          d.setDate(d.getDate() - day);
          d.setHours(0, 0, 0, 0);
          return d;
        })(),
        end: (() => {
          const d = new Date(today);
          const day = d.getDay();
          d.setDate(d.getDate() - day + 7);
          d.setHours(0, 0, 0, 0);
          return d;
        })(),
      },
      {
        type: 'monthly',
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      },
      {
        type: 'all_time',
        start: new Date(0),
        end: new Date(),
      },
    ];

    for (const period of periods) {
      console.log(`📊 Processing ${period.type} leaderboard...`);

      // Get user statistics for the period
      const { data: stats, error: statsError } = await supabase.rpc('get_period_user_stats', {
        period_type: period.type,
        start_date: period.start.toISOString(),
        end_date: period.end.toISOString(),
      });

      if (statsError) {
        console.error(`Error getting stats for ${period.type}:`, statsError);
        
        // Fallback: calculate manually
        const { data: verifications } = await supabase
          .from('verifications')
          .select('user_id, trust_score, created_at')
          .gte('created_at', period.start.toISOString())
          .lt('created_at', period.end.toISOString());

        if (!verifications || verifications.length === 0) {
          console.log(`No verifications for ${period.type}`);
          continue;
        }

        // Group by user
        const userStats = verifications.reduce((acc: any, v: any) => {
          if (!acc[v.user_id]) {
            acc[v.user_id] = {
              user_id: v.user_id,
              verification_count: 0,
              total_trust_score: 0,
              points: 0,
            };
          }
          acc[v.user_id].verification_count++;
          acc[v.user_id].total_trust_score += v.trust_score;
          acc[v.user_id].points += Math.round(v.trust_score / 10); // 10 points per trust score point
          return acc;
        }, {});

        // Convert to array and sort
        const sortedStats = Object.values(userStats)
          .map((stat: any) => ({
            ...stat,
            trust_score_avg: stat.total_trust_score / stat.verification_count,
          }))
          .sort((a: any, b: any) => b.points - a.points);

        // Delete existing entries for this period
        await supabase
          .from('leaderboard_entries')
          .delete()
          .eq('period_type', period.type)
          .gte('period_start', period.start.toISOString().split('T')[0]);

        // Insert new entries
        const entries = sortedStats.map((stat: any, index: number) => ({
          user_id: stat.user_id,
          period_type: period.type,
          period_start: period.start.toISOString().split('T')[0],
          period_end: period.end.toISOString().split('T')[0],
          verification_count: stat.verification_count,
          trust_score_avg: stat.trust_score_avg,
          points: stat.points,
          rank: index + 1,
        }));

        if (entries.length > 0) {
          const { error: insertError } = await supabase
            .from('leaderboard_entries')
            .insert(entries);

          if (insertError) {
            console.error(`Error inserting ${period.type} entries:`, insertError);
          } else {
            console.log(`✅ Created ${entries.length} entries for ${period.type}`);
          }
        }
      }
    }

    console.log('🎉 Leaderboard update complete!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Leaderboards updated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error updating leaderboards:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
