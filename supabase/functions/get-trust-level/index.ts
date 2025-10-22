import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface TrustLevelRequest {
  claim_text?: string;
  url?: string;
  claim_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // API Key validation
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) {
      const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
      const keyHashHex = Array.from(new Uint8Array(keyHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data: keyData } = await supabase
        .from('api_keys')
        .select('user_id, is_active')
        .eq('key_hash', keyHashHex)
        .single();

      if (!keyData?.is_active) {
        return new Response(JSON.stringify({ error: 'Invalid or inactive API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log API usage
      await supabase.from('api_usage_logs').insert({
        api_key_hash: keyHashHex,
        endpoint: '/get-trust-level',
        status_code: 200,
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    const { claim_text, url, claim_id }: TrustLevelRequest = await req.json();

    let query = supabase
      .from('verifications')
      .select(`
        id,
        content,
        trust_score,
        confidence_level,
        created_at,
        metadata,
        sources (
          domain,
          reliability_score,
          published_at
        ),
        nft_badges (
          transaction_hash,
          minted_at,
          token_id,
          opensea_url
        )
      `);

    if (claim_id) {
      query = query.eq('id', claim_id);
    } else if (url) {
      query = query.or(`metadata->>source_url.eq.${url},sources.domain.eq.${new URL(url).hostname}`);
    } else if (claim_text) {
      query = query.ilike('content', `%${claim_text}%`);
    } else {
      return new Response(JSON.stringify({ error: 'Must provide claim_text, url, or claim_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single();

    if (error || !data) {
      return new Response(JSON.stringify({ 
        error: 'Verification not found',
        trust_score: null,
        verification_confidence: null 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = {
      trust_score: data.trust_score,
      verification_confidence: data.confidence_level,
      claim_text: data.content,
      source_metadata: {
        sources: data.sources?.map((s: any) => ({
          domain: s.domain,
          reliability: s.reliability_score,
          published_at: s.published_at
        })) || [],
        total_sources: data.sources?.length || 0
      },
      on_chain_tx_hash: data.nft_badges?.[0]?.transaction_hash || null,
      verification_timestamp: data.created_at,
      nft_badge: data.nft_badges?.[0] ? {
        token_id: data.nft_badges[0].token_id,
        opensea_url: data.nft_badges[0].opensea_url,
        minted_at: data.nft_badges[0].minted_at
      } : null,
      verification_id: data.id
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-trust-level:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
