import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface RateLimitInfo {
  allowed: boolean;
  tier: string;
  limit: number;
  remaining: number;
}

async function checkRateLimit(apiKey: string, supabase: any): Promise<RateLimitInfo> {
  // Get API key details
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('user_id, name, is_active')
    .eq('key_hash', apiKey)
    .single();

  if (keyError || !keyData || !keyData.is_active) {
    return { allowed: false, tier: 'none', limit: 0, remaining: 0 };
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', apiKey);

  // Get user's license to determine tier
  const { data: license } = await supabase
    .from('licenses')
    .select('license_type, status')
    .eq('user_id', keyData.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const tier = license?.license_type || 'trial';
  
  // Rate limits by tier
  const limits: Record<string, number> = {
    trial: 100,      // 100 requests/day
    pro: 10000,      // 10K requests/day
    enterprise: -1   // Unlimited
  };

  const dailyLimit = limits[tier] || 100;
  
  if (dailyLimit === -1) {
    return { allowed: true, tier, limit: -1, remaining: -1 };
  }

  // Check usage in last 24 hours (simple implementation)
  // In production, use Redis for distributed rate limiting
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_hash', apiKey)
    .gte('created_at', oneDayAgo);

  const used = count || 0;
  const remaining = Math.max(0, dailyLimit - used);

  return {
    allowed: used < dailyLimit,
    tier,
    limit: dailyLimit,
    remaining
  };
}

async function logApiUsage(apiKey: string, endpoint: string, statusCode: number, supabase: any) {
  await supabase.from('api_usage_logs').insert({
    api_key_hash: apiKey,
    endpoint,
    status_code: statusCode,
    created_at: new Date().toISOString()
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    // Check rate limit
    const rateLimit = await checkRateLimit(apiKey, supabase);
    
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Tier': rateLimit.tier
    };

    if (!rateLimit.allowed) {
      await logApiUsage(apiKey, '/get-trust-analytics', 429, supabase);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Upgrade your plan for higher limits.' }),
        { status: 429, headers }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const region = url.searchParams.get('region');
    const topic = url.searchParams.get('topic');
    const domain = url.searchParams.get('domain');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('trust_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (region) query = query.eq('region', region);
    if (topic) query = query.eq('topic', topic);
    if (domain) query = query.eq('domain', domain);
    if (startDate) query = query.gte('analysis_period_start', startDate);
    if (endDate) query = query.lte('analysis_period_end', endDate);
    
    // Free tier: 30 days only
    if (rateLimit.tier === 'trial') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', thirtyDaysAgo);
    }

    query = query.limit(Math.min(limit, 1000)); // Max 1000 records

    const { data, error } = await query;

    if (error) throw error;

    await logApiUsage(apiKey, '/get-trust-analytics', 200, supabase);

    return new Response(
      JSON.stringify({
        data: data || [],
        metadata: {
          total_records: data?.length || 0,
          period: startDate && endDate ? `${startDate} to ${endDate}` : 'all time',
          filters_applied: { region, topic, domain },
          api_version: 'v1',
          processing_time_ms: Date.now() - startTime,
          tier: rateLimit.tier
        }
      }),
      { headers, status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});