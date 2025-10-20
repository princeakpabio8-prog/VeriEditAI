import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔥 Calculating virality scores...');

    // Get all active viral claims
    const { data: activeClaims } = await supabaseClient
      .from('viral_claims')
      .select('id, engagement_score, first_seen_at, claim_hash, platform, status')
      .eq('status', 'monitoring')
      .order('engagement_velocity', { ascending: false });

    if (!activeClaims || activeClaims.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active claims to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let criticalAlerts = 0;
    let highAlerts = 0;
    let updated = 0;

    for (const claim of activeClaims) {
      // Get last two snapshots to calculate velocity
      const { data: snapshots } = await supabaseClient
        .from('engagement_snapshots')
        .select('total_engagement, recorded_at')
        .eq('viral_claim_id', claim.id)
        .order('recorded_at', { ascending: false })
        .limit(2);

      if (!snapshots || snapshots.length < 2) continue;

      const latest = snapshots[0];
      const previous = snapshots[1];
      
      const timeDiff = (new Date(latest.recorded_at).getTime() - 
                       new Date(previous.recorded_at).getTime()) / (1000 * 60 * 60); // hours
      
      if (timeDiff === 0) continue;

      const engagementDiff = latest.total_engagement - previous.total_engagement;
      const velocity = engagementDiff / timeDiff;

      // Calculate recency factor (newer = higher multiplier)
      const hoursSinceFirstSeen = (Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.max(0.5, 1 - (hoursSinceFirstSeen / 48)); // Decay over 48 hours

      // Check for cross-platform presence
      const { data: duplicates } = await supabaseClient
        .from('viral_claims')
        .select('platform')
        .eq('claim_hash', claim.claim_hash)
        .neq('id', claim.id);

      const crossPlatformMultiplier = duplicates && duplicates.length > 0 
        ? 1 + (duplicates.length * 0.5) // 1.5x for 1 platform, 2x for 2 platforms, etc.
        : 1;

      const viralityScore = velocity * recencyFactor * crossPlatformMultiplier;

      // Calculate rarity tier based on engagement metrics
      const ageInHours = hoursSinceFirstSeen;
      let rarityTier = 'COMMON';
      
      if (claim.engagement_score >= 10000 && ageInHours < 6 && velocity > 1500) {
        rarityTier = 'LEGENDARY';
      } else if (claim.engagement_score >= 5000 && ageInHours < 24 && velocity > 500) {
        rarityTier = 'EPIC';
      } else if (claim.engagement_score >= 2000 && ageInHours < 48 && velocity > 100) {
        rarityTier = 'RARE';
      } else if (claim.engagement_score >= 1000) {
        rarityTier = 'UNCOMMON';
      }

      // Update claim with new velocity, virality score, and rarity tier
      await supabaseClient
        .from('viral_claims')
        .update({
          engagement_velocity: velocity,
          virality_score: viralityScore,
          rarity_tier: rarityTier,
          last_checked_at: new Date().toISOString(),
          metadata: {
            ...(claim.metadata || {}),
            virality_score: viralityScore,
            recency_factor: recencyFactor,
            cross_platform_multiplier: crossPlatformMultiplier,
            rarity_tier: rarityTier,
          }
        })
        .eq('id', claim.id);

      updated++;

      // Trigger image generation if not already present
      if (claim.status === 'monitoring' || claim.status === 'trending') {
        const { data: claimData } = await supabaseClient
          .from('viral_claims')
          .select('image_url')
          .eq('id', claim.id)
          .single();
        
        if (!claimData?.image_url) {
          // Fire and forget image generation
          supabaseClient.functions.invoke('generate-claim-image', {
            body: {
              claim_text: claim.claim_text || '',
              viral_claim_id: claim.id
            }
          }).catch(err => console.error('Image gen error:', err));
        }
      }

      // Check alert thresholds
      if (claim.engagement_score >= 1000) {
        const ageInHours = (Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60);
        
        if (ageInHours < 6) {
          criticalAlerts++;
          console.log(`🚨 CRITICAL: Claim ${claim.id} - ${claim.engagement_score} engagement in ${ageInHours.toFixed(1)}h (velocity: ${velocity.toFixed(0)}/hr)`);
        } else if (ageInHours < 24) {
          highAlerts++;
          console.log(`⚠️ HIGH: Claim ${claim.id} - ${claim.engagement_score} engagement in ${ageInHours.toFixed(1)}h (velocity: ${velocity.toFixed(0)}/hr)`);
        }
      }

      // Auto-expire claims older than 7 days with low engagement
      const daysSinceFirstSeen = hoursSinceFirstSeen / 24;
      if (daysSinceFirstSeen > 7 && claim.engagement_score < 500) {
        await supabaseClient
          .from('viral_claims')
          .update({ status: 'expired' })
          .eq('id', claim.id);
      }
    }

    console.log(`✅ Virality calculation complete: ${updated} claims updated, ${criticalAlerts} critical alerts, ${highAlerts} high alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        criticalAlerts,
        highAlerts,
        totalActive: activeClaims.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in calculate-virality:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
