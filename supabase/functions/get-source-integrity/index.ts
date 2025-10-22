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
        endpoint: '/get-source-integrity',
        status_code: 200,
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    const organizationName = url.searchParams.get('organization_name');

    if (!domain && !organizationName) {
      return new Response(JSON.stringify({ error: 'Must provide domain or organization_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let response: any = {};

    // Query source reputation by domain
    if (domain) {
      const { data: sourceRep } = await supabase
        .from('source_reputation')
        .select('*')
        .eq('domain', domain)
        .single();

      const { data: recentVerifications } = await supabase
        .from('sources')
        .select(`
          verification_id,
          reliability_score,
          verifications (
            content,
            trust_score,
            created_at
          )
        `)
        .eq('domain', domain)
        .order('created_at', { ascending: false })
        .limit(1);

      response = {
        domain,
        bias_score: sourceRep?.political_bias || 'Unknown',
        reliability: {
          overall_score: sourceRep?.overall_score || null,
          accuracy_rate: sourceRep?.accuracy_rate || null,
          verification_count: sourceRep?.verification_count || 0
        },
        ownership_info: sourceRep?.ownership || 'Unknown',
        historical_reliability: sourceRep?.accuracy_rate 
          ? sourceRep.accuracy_rate > 90 ? 'Excellent' 
          : sourceRep.accuracy_rate > 75 ? 'Good'
          : sourceRep.accuracy_rate > 50 ? 'Fair' : 'Poor'
          : 'Unknown',
        last_verified_claim: recentVerifications?.[0] ? {
          claim: recentVerifications[0].verifications?.content?.substring(0, 150),
          trust_score: recentVerifications[0].verifications?.trust_score,
          verified_at: recentVerifications[0].verifications?.created_at
        } : null,
        editorial_quality: sourceRep?.editorial_quality || null,
        factual_reporting: sourceRep?.factual_reporting || null
      };
    }

    // Query organization by name
    if (organizationName) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .ilike('name', `%${organizationName}%`)
        .single();

      if (org) {
        response = {
          ...response,
          organization: {
            name: org.name,
            domain: org.domain,
            industry: org.industry,
            verified_partner: org.verified_partner,
            avg_trust_score: org.avg_trust_score,
            total_verifications: org.total_verifications,
            contact: org.contact_email
          }
        };
      }
    }

    if (Object.keys(response).length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No integrity data found for the provided source',
        domain,
        organization_name: organizationName
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-source-integrity:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
