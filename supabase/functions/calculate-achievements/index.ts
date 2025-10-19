import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AchievementCheck {
  achievement_key: string;
  current_count: number;
  required_count: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('🏆 Calculating achievements for user:', user.id);

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabaseClient
      .from('achievements')
      .select('*');

    if (achievementsError) throw achievementsError;

    // Get user's current achievements
    const { data: userAchievements } = await supabaseClient
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    // Get user stats
    const { data: verifications } = await supabaseClient
      .from('verifications')
      .select('trust_score, created_at')
      .eq('user_id', user.id);

    const { data: nftBadges } = await supabaseClient
      .from('nft_badges')
      .select('id')
      .eq('user_id', user.id);

    const { data: publicVerifications } = await supabaseClient
      .from('public_verifications')
      .select('id')
      .eq('user_id', user.id);

    const { data: roomMemberships } = await supabaseClient
      .from('room_memberships')
      .select('id')
      .eq('user_id', user.id);

    const { data: threadComments } = await supabaseClient
      .from('thread_comments')
      .select('id')
      .eq('author_id', user.id);

    const { data: createdRooms } = await supabaseClient
      .from('lighthouse_rooms')
      .select('id')
      .eq('creator_id', user.id);

    const { data: referrals } = await supabaseClient
      .from('referrals')
      .select('id')
      .eq('referrer_id', user.id)
      .eq('status', 'completed');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('created_at')
      .eq('user_id', user.id)
      .single();

    // Calculate stats
    const totalVerifications = verifications?.length || 0;
    const totalNFTs = nftBadges?.length || 0;
    const totalShares = publicVerifications?.length || 0;
    const totalRooms = roomMemberships?.length || 0;
    const totalComments = threadComments?.length || 0;
    const totalCreatedRooms = createdRooms?.length || 0;
    const totalReferrals = referrals?.length || 0;
    const perfectScores = verifications?.filter(v => v.trust_score === 100).length || 0;

    // Check for speed demon (10 verifications in 24h)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentVerifications = verifications?.filter(v => 
      new Date(v.created_at) > yesterday
    ).length || 0;

    // Check for early adopter (joined in first month)
    const appLaunchDate = new Date('2024-01-01'); // Adjust to your actual launch date
    const firstMonth = new Date(appLaunchDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const isEarlyAdopter = profile && new Date(profile.created_at) < firstMonth;

    // Check which achievements to award
    const achievementChecks: AchievementCheck[] = [
      { achievement_key: 'first_steps', current_count: totalVerifications, required_count: 1 },
      { achievement_key: 'truth_seeker', current_count: totalVerifications, required_count: 10 },
      { achievement_key: 'fact_champion', current_count: totalVerifications, required_count: 50 },
      { achievement_key: 'truth_master', current_count: totalVerifications, required_count: 100 },
      { achievement_key: 'legendary_verifier', current_count: totalVerifications, required_count: 500 },
      { achievement_key: 'perfect_score', current_count: perfectScores, required_count: 10 },
      { achievement_key: 'speed_demon', current_count: recentVerifications, required_count: 10 },
      { achievement_key: 'badge_collector', current_count: totalNFTs, required_count: 1 },
      { achievement_key: 'badge_hoarder', current_count: totalNFTs, required_count: 5 },
      { achievement_key: 'badge_master', current_count: totalNFTs, required_count: 20 },
      { achievement_key: 'whale', current_count: totalNFTs, required_count: 50 },
      { achievement_key: 'first_share', current_count: totalShares, required_count: 1 },
      { achievement_key: 'influencer', current_count: totalShares, required_count: 100 },
      { achievement_key: 'team_player', current_count: totalRooms, required_count: 5 },
      { achievement_key: 'conversationalist', current_count: totalComments, required_count: 50 },
      { achievement_key: 'community_leader', current_count: totalCreatedRooms, required_count: 1 },
      { achievement_key: 'referral_master', current_count: totalReferrals, required_count: 10 },
    ];

    // Add special achievements
    if (isEarlyAdopter) {
      achievementChecks.push({ achievement_key: 'early_adopter', current_count: 1, required_count: 0 });
    }

    const newAchievements = [];

    for (const check of achievementChecks) {
      const achievement = achievements?.find(a => a.achievement_key === check.achievement_key);
      if (!achievement || earnedAchievementIds.has(achievement.id)) continue;

      if (check.current_count >= check.required_count) {
        // Award achievement
        const { error: insertError } = await supabaseClient
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            progress_current: check.current_count,
            progress_required: check.required_count,
          });

        if (!insertError) {
          newAchievements.push(achievement);
          console.log(`✅ Awarded achievement: ${achievement.name}`);

          // Create notification
          await supabaseClient.from('notifications').insert({
            user_id: user.id,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You earned the "${achievement.name}" achievement!`,
            metadata: {
              achievement_id: achievement.id,
              achievement_name: achievement.name,
              achievement_tier: achievement.tier,
              points: achievement.points,
            },
          });
        }
      }
    }

    // Update leaderboard stats
    const totalPoints = await calculateTotalPoints(supabaseClient, user.id);
    const highestTrustScore = Math.max(...(verifications?.map(v => v.trust_score) || [0]));

    await supabaseClient
      .from('user_leaderboard_stats')
      .upsert({
        user_id: user.id,
        total_verifications: totalVerifications,
        total_nft_badges: totalNFTs,
        total_shares: totalShares,
        total_lighthouse_contributions: totalComments + totalCreatedRooms,
        total_achievement_points: totalPoints,
        highest_trust_score: highestTrustScore,
        updated_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        success: true,
        new_achievements: newAchievements,
        stats: {
          total_verifications: totalVerifications,
          total_nft_badges: totalNFTs,
          total_achievement_points: totalPoints,
          achievements_earned: newAchievements.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error calculating achievements:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function calculateTotalPoints(supabaseClient: any, userId: string): Promise<number> {
  const { data } = await supabaseClient
    .from('user_achievements')
    .select(`
      achievements (points)
    `)
    .eq('user_id', userId);

  return data?.reduce((sum: number, ua: any) => sum + (ua.achievements?.points || 0), 0) || 0;
}
