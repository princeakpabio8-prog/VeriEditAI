import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndexerTarget {
  name: string;
  endpoint: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
}

const indexers: IndexerTarget[] = [
  {
    name: 'AI Gateway',
    endpoint: 'https://aigateway.io/api/submit',
    method: 'POST',
  },
  {
    name: 'Public APIs Hub',
    endpoint: 'https://api.publicapis.org/entries',
    method: 'POST',
  },
  {
    name: 'APIs Guru',
    endpoint: 'https://api.apis.guru/v2/specs',
    method: 'POST',
  },
  {
    name: 'OpenAPI Directory',
    endpoint: 'https://directory.openapi.tools/api/submit',
    method: 'POST',
  },
];

async function submitToIndexer(
  indexer: IndexerTarget,
  payload: any,
  supabase: any
): Promise<{ success: boolean; response_code?: number; response_body?: any }> {
  console.log(`📡 Submitting to ${indexer.name}...`);

  try {
    const response = await fetch(indexer.endpoint, {
      method: indexer.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VeriEdit-Discovery-Beacon/1.0',
        ...(indexer.headers || {}),
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = { raw: responseBody };
    }

    const success = response.status >= 200 && response.status < 300;

    // Log to database
    await supabase.from('discovery_beacon_logs').insert({
      indexer_name: indexer.name,
      status: success ? 'success' : 'failed',
      response_code: response.status,
      response_body: parsedBody,
    });

    console.log(`${success ? '✅' : '❌'} ${indexer.name}: ${response.status}`);

    return {
      success,
      response_code: response.status,
      response_body: parsedBody,
    };
  } catch (error) {
    console.error(`❌ Error submitting to ${indexer.name}:`, error);

    // Log failure
    await supabase.from('discovery_beacon_logs').insert({
      indexer_name: indexer.name,
      status: 'failed',
      response_code: null,
      response_body: { error: error.message },
    });

    return { success: false, response_body: { error: error.message } };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Discovery Beacon triggered');

    // Fetch OpenAPI spec
    const specUrl = `${supabaseUrl}/functions/v1/api-spec`;
    console.log(`📋 Fetching OpenAPI spec from ${specUrl}`);

    const specResponse = await fetch(specUrl);
    if (!specResponse.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${specResponse.status}`);
    }

    const openApiSpec = await specResponse.json();

    // Prepare submission payload
    const payload = {
      api: {
        name: 'VeriEdit AI Trust Oracle',
        title: 'VeriEdit AI — Proof-of-Truth Oracle',
        description:
          'Real-time verification and trust scoring infrastructure powering the emerging truth economy. Built on Polygon blockchain.',
        version: '1.0.0',
        baseUrl: 'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1',
        openApiUrl: specUrl,
        documentationUrl: 'https://trust-lighthouse.lovable.app/api/docs',
        website: 'https://trust-lighthouse.lovable.app',
        category: 'AI & Machine Learning',
        subcategory: 'Data Integrity',
        tags: [
          'trust infrastructure',
          'fact-checking API',
          'AI verification',
          'proof of truth',
          'Polygon oracle',
          'web3',
          'blockchain',
        ],
        keywords: [
          'verification',
          'fact-checking',
          'trust-scoring',
          'nft',
          'polygon',
          'truth-oracle',
        ],
        network: 'Polygon',
        blockchain: 'Polygon Mainnet',
        authentication: 'optional',
        authTypes: ['API Key', 'None'],
        pricing: 'freemium',
        cors: true,
        openapi: openApiSpec,
      },
      contact: {
        name: 'VeriEdit AI',
        email: 'api@verifiedit.ai',
        url: 'https://trust-lighthouse.lovable.app',
      },
      metadata: {
        submitted_at: new Date().toISOString(),
        beacon_version: '1.0.0',
      },
    };

    // Submit to all indexers in parallel
    const submissions = await Promise.all(
      indexers.map((indexer) => submitToIndexer(indexer, payload, supabase))
    );

    // Calculate summary
    const summary = {
      total: indexers.length,
      successful: submissions.filter((s) => s.success).length,
      failed: submissions.filter((s) => !s.success).length,
      timestamp: new Date().toISOString(),
      results: indexers.map((indexer, i) => ({
        indexer: indexer.name,
        success: submissions[i].success,
        status_code: submissions[i].response_code,
      })),
    };

    console.log(
      `✅ Discovery Beacon completed: ${summary.successful}/${summary.total} successful`
    );

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Discovery Beacon error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
