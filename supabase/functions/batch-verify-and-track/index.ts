import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

async function checkPremiumAccess(apiKey: string, supabase: any) {
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', apiKey)
    .single();

  if (error || !keyData?.is_active) return { allowed: false, tier: 'none' };

  const { data: license } = await supabase
    .from('licenses')
    .select('license_type, status, features')
    .eq('user_id', keyData.user_id)
    .eq('status', 'active')
    .single();

  const tier = license?.license_type || 'trial';
  const isPro = tier === 'pro' || tier === 'enterprise';

  return { allowed: isPro, tier, userId: keyData.user_id };
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
        JSON.stringify({ error: 'API key required for batch operations' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const access = await checkPremiumAccess(apiKey, supabase);
    
    if (!access.allowed) {
      return new Response(
        JSON.stringify({ error: 'Batch verification requires Pro or Enterprise plan' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { urls, track_sentiment = false, track_entities = false } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Provide "urls" array in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const maxBatch = access.tier === 'enterprise' ? 100 : 50;
    const urlsToProcess = urls.slice(0, maxBatch);

    const results = [];
    let creditsUsed = 0;

    for (const url of urlsToProcess) {
      try {
        // Call verify function
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify', {
          body: {
            content: url,
            user_id: access.userId
          }
        });

        if (verifyError) {
          results.push({
            url,
            error: verifyError.message,
            status: 'failed'
          });
          continue;
        }

        creditsUsed++;

        const result: any = {
          url,
          trust_score: verifyData.confidence,
          status: verifyData.status,
          processing_time_ms: verifyData.processing_time || 0
        };

        // Add sentiment/entities if requested and available
        if (track_sentiment && verifyData.sentiment_label) {
          result.sentiment = verifyData.sentiment_label;
          result.sentiment_score = verifyData.sentiment_score;
        }

        if (track_entities && verifyData.detected_entities) {
          result.entities = verifyData.detected_entities;
        }

        results.push(result);

      } catch (err) {
        results.push({
          url,
          error: err.message,
          status: 'error'
        });
      }
    }

    await supabase.from('api_usage_logs').insert({
      api_key_hash: apiKey,
      endpoint: '/batch-verify-and-track',
      status_code: 200,
      metadata: { batch_size: urlsToProcess.length, credits_used: creditsUsed }
    });

    return new Response(
      JSON.stringify({
        results,
        metadata: {
          total_processed: urlsToProcess.length,
          successful: results.filter(r => !r.error).length,
          failed: results.filter(r => r.error).length,
          credits_used: creditsUsed,
          processing_time_ms: Date.now() - startTime,
          tier: access.tier
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Batch API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});