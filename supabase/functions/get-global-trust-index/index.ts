import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public endpoint - no API key required for basic access
    // Premium features require API key
    const apiKey = req.headers.get('x-api-key');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let isPremium = false;
    if (apiKey) {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('is_active')
        .eq('key_hash', apiKey)
        .single();
      
      isPremium = keyData?.is_active || false;
    }

    // Get latest global trust index
    const { data: snapshot, error: snapshotError } = await supabase
      .from('trust_index_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== 'PGRST116') throw snapshotError;

    // Calculate 30-day trend
    let trend30d = 0;
    if (isPremium && snapshot) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      const { data: oldSnapshot } = await supabase
        .from('trust_index_snapshots')
        .select('global_trust_index')
        .eq('snapshot_date', thirtyDaysAgo)
        .single();

      if (oldSnapshot) {
        trend30d = parseFloat((snapshot.global_trust_index - oldSnapshot.global_trust_index).toFixed(2));
      }
    }

    const response: any = {
      global_index: snapshot?.global_trust_index || 70,
      high_credibility_pct: snapshot?.high_credibility_percentage || 0,
      total_verifications: snapshot?.total_verifications || 0,
      last_updated: snapshot?.snapshot_date || new Date().toISOString().split('T')[0],
      api_version: 'v1'
    };

    // Premium features
    if (isPremium && snapshot) {
      response.trend_30d = trend30d;
      response.misinformation_hotspots = snapshot.misinformation_spike_regions || [];
      response.trending_low_topics = snapshot.trending_low_topics || [];
      response.metadata = snapshot.metadata || {};
    }

    if (apiKey) {
      await supabase.from('api_usage_logs').insert({
        api_key_hash: apiKey,
        endpoint: '/get-global-trust-index',
        status_code: 200
      });
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});