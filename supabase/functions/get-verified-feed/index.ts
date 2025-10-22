import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // API Key validation (optional for public feed)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) {
      const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
      const keyHashHex = Array.from(new Uint8Array(keyHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      await supabase.from('api_usage_logs').insert({
        api_key_hash: keyHashHex,
        endpoint: '/get-verified-feed',
        status_code: 200,
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const minTrustScore = parseInt(url.searchParams.get('min_trust_score') || '50');
    const region = url.searchParams.get('region');
    const category = url.searchParams.get('category');

    let query = supabase
      .from('verifications')
      .select(`
        id,
        content,
        trust_score,
        verification_type,
        created_at,
        metadata,
        sources (
          domain,
          reliability_score,
          source_region
        ),
        nft_badges (
          token_id,
          opensea_url,
          rarity_tier,
          minted_at
        )
      `)
      .gte('trust_score', minTrustScore)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    if (category) {
      query = query.eq('verification_type', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    const feed = data?.map((v: any) => ({
      verification_id: v.id,
      title: v.content.substring(0, 100) + (v.content.length > 100 ? '...' : ''),
      trust_score: v.trust_score,
      claim_type: v.verification_type,
      verified_at: v.created_at,
      domains: v.sources?.map((s: any) => s.domain).filter(Boolean).slice(0, 3) || [],
      region: v.sources?.[0]?.source_region || 'International',
      nft_badge_url: v.nft_badges?.[0]?.opensea_url || null,
      rarity_tier: v.nft_badges?.[0]?.rarity_tier || null,
      source_count: v.sources?.length || 0,
      avg_source_reliability: v.sources?.length > 0
        ? Math.round(v.sources.reduce((acc: number, s: any) => acc + (s.reliability_score || 0), 0) / v.sources.length)
        : 0
    })).filter((item: any) => {
      if (region) {
        return item.region === region;
      }
      return true;
    }) || [];

    const response = {
      total: feed.length,
      feed,
      metadata: {
        generated_at: new Date().toISOString(),
        min_trust_score: minTrustScore,
        filters_applied: { region, category },
        api_version: '1.0'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-verified-feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
