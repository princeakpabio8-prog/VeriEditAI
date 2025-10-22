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

    // API Key validation
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) {
      const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
      const keyHashHex = Array.from(new Uint8Array(keyHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      await supabase.from('api_usage_logs').insert({
        api_key_hash: keyHashHex,
        endpoint: '/reference-oracle',
        status_code: 200,
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    const { verification_id, claim_text } = await req.json();

    if (!verification_id && !claim_text) {
      return new Response(JSON.stringify({ error: 'Must provide verification_id or claim_text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('verifications')
      .select(`
        id,
        content,
        trust_score,
        confidence_level,
        created_at,
        sources (domain, reliability_score),
        nft_badges (token_id, transaction_hash)
      `);

    if (verification_id) {
      query = query.eq('id', verification_id);
    } else {
      query = query.ilike('content', `%${claim_text}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single();

    if (error || !data) {
      return new Response(JSON.stringify({ 
        error: 'Verification not found',
        citation: null 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trustLevel = data.trust_score >= 80 ? 'highly verified' 
      : data.trust_score >= 60 ? 'verified'
      : data.trust_score >= 40 ? 'partially verified' : 'disputed';

    const citation = {
      text: `According to VeriEdit AI (Trust Score: ${data.trust_score}%, Confidence: ${data.confidence_level || 'Medium'}), this claim has been ${trustLevel}.`,
      markdown: `**VeriEdit AI Verification**: Trust Score **${data.trust_score}%** | Status: *${trustLevel}* | [View Details](https://verifiedit.ai/verify/${data.id})`,
      structured: {
        source: 'VeriEdit AI Trust Oracle',
        trust_score: data.trust_score,
        confidence_level: data.confidence_level,
        verification_status: trustLevel,
        verified_at: data.created_at,
        verification_url: `https://verifiedit.ai/verify/${data.id}`,
        on_chain_proof: data.nft_badges?.[0]?.transaction_hash || null,
        source_count: data.sources?.length || 0,
        avg_source_reliability: data.sources?.length > 0
          ? Math.round(data.sources.reduce((acc: number, s: any) => acc + (s.reliability_score || 0), 0) / data.sources.length)
          : null
      },
      bibtex: `@misc{verifiedit${new Date(data.created_at).getFullYear()},
  author = {VeriEdit AI},
  title = {Verified Claim: ${data.content.substring(0, 50).replace(/[^\w\s]/gi, '')}},
  year = {${new Date(data.created_at).getFullYear()}},
  note = {Trust Score: ${data.trust_score}%, Verified: ${new Date(data.created_at).toLocaleDateString()}},
  url = {https://verifiedit.ai/verify/${data.id}}
}`
    };

    return new Response(JSON.stringify(citation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in reference-oracle:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
