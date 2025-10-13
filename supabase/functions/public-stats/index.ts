import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get total verifications count
    const { count: totalVerifications } = await supabaseClient
      .from('verifications')
      .select('*', { count: 'exact', head: true });

    // Get average trust score
    const { data: avgData } = await supabaseClient
      .from('verifications')
      .select('trust_score')
      .not('trust_score', 'is', null);

    const averageTrustScore = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((sum, v) => sum + (v.trust_score || 0), 0) / avgData.length)
      : 0;

    // Get active users this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { count: activeUsers } = await supabaseClient
      .from('verifications')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // Get countries served (placeholder - would need geo data)
    const countriesServed = 45;

    const stats = {
      totalVerifications: totalVerifications || 0,
      averageTrustScore,
      activeUsers: activeUsers || 0,
      countriesServed,
      lastUpdated: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(stats),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // 1 hour cache
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching public stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
