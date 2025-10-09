import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

async function checkRateLimit(apiKey: string, supabase: any) {
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', apiKey)
    .single();

  if (error || !keyData?.is_active) return { allowed: false, tier: 'none' };

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', apiKey);

  const { data: license } = await supabase
    .from('licenses')
    .select('license_type')
    .eq('user_id', keyData.user_id)
    .eq('status', 'active')
    .single();

  return { allowed: true, tier: license?.license_type || 'trial' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required. Include X-API-Key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rateLimit = await checkRateLimit(apiKey, supabase);
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    const domains = url.searchParams.get('domains')?.split(',').filter(Boolean);

    if (!domain && !domains) {
      return new Response(
        JSON.stringify({ error: 'Provide "domain" or "domains" (comma-separated) query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch lookup
    if (domains) {
      const { data, error } = await supabase
        .from('source_reputation')
        .select('domain, base_score, accuracy_rate, verification_count, political_leaning_score, factual_reporting_score, transparency_rating, last_verified_at')
        .in('domain', domains.slice(0, 50)); // Max 50 domains

      if (error) throw error;

      const results = domains.map(d => {
        const match = data?.find(item => item.domain === d);
        if (!match) return { domain: d, error: 'Domain not found' };
        
        return {
          domain: match.domain,
          trust_score: match.base_score,
          verification_count: match.verification_count,
          accuracy_rate: match.accuracy_rate,
          political_bias: match.political_leaning_score,
          factual_reporting: match.factual_reporting_score,
          transparency_rating: match.transparency_rating,
          last_updated: match.last_verified_at
        };
      });

      return new Response(
        JSON.stringify({ results, api_version: 'v1' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Single domain lookup
    const { data, error } = await supabase
      .from('source_reputation')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ 
            domain, 
            error: 'Domain not in reputation database',
            trust_score: 60, // Default neutral score
            verification_count: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      throw error;
    }

    await supabase.from('api_usage_logs').insert({
      api_key_hash: apiKey,
      endpoint: '/get-source-reputation',
      status_code: 200
    });

    return new Response(
      JSON.stringify({
        domain: data.domain,
        trust_score: data.base_score,
        verification_count: data.verification_count,
        accuracy_rate: data.accuracy_rate,
        political_bias: data.political_leaning_score,
        factual_reporting: data.factual_reporting_score,
        editorial_quality: data.editorial_quality,
        transparency_rating: data.transparency_rating,
        owner_entity: data.owner_entity,
        funding_sources: data.funding_sources,
        last_updated: data.last_verified_at,
        metadata: {
          region: data.region,
          source_type: data.source_type
        }
      }),
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