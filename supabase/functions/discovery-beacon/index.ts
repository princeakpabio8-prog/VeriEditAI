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

// Note: Most API directories don't have automated submission endpoints.
// This function documents the submission process and creates a submission package
// that can be manually submitted to these directories.

interface DirectoryInfo {
  name: string;
  submission_url: string;
  method: 'GitHub PR' | 'Form' | 'Email';
  instructions: string;
}

const directories: DirectoryInfo[] = [
  {
    name: 'APIs.guru OpenAPI Directory',
    submission_url: 'https://github.com/APIs-guru/openapi-directory',
    method: 'GitHub PR',
    instructions: 'Fork the repo, add your OpenAPI spec to apis/, submit PR',
  },
  {
    name: 'Public APIs List',
    submission_url: 'https://github.com/public-apis/public-apis',
    method: 'GitHub PR',
    instructions: 'Add your API to README.md in the appropriate category, submit PR',
  },
  {
    name: 'RapidAPI Hub',
    submission_url: 'https://rapidapi.com/hub',
    method: 'Form',
    instructions: 'Register as provider, upload OpenAPI spec through dashboard',
  },
  {
    name: 'Postman Public API Network',
    submission_url: 'https://www.postman.com/api-network/',
    method: 'Form',
    instructions: 'Import OpenAPI spec to Postman, publish to API Network',
  },
];

async function generateSubmissionPackage(
  directory: DirectoryInfo,
  payload: any,
  supabase: any
): Promise<{ success: boolean; response_code?: number; response_body?: any }> {
  console.log(`📦 Generating submission package for ${directory.name}...`);

  try {
    // Create submission package with instructions
    const submissionPackage = {
      directory: directory.name,
      method: directory.method,
      url: directory.submission_url,
      instructions: directory.instructions,
      api_info: payload.api,
      openapi_spec_url: payload.api.openApiUrl,
      ready_to_submit: true,
      notes: `Visit ${directory.submission_url} and follow the ${directory.method} process`,
    };

    // Log successful package creation
    await supabase.from('discovery_beacon_logs').insert({
      indexer_name: directory.name,
      status: 'success',
      response_code: 200,
      response_body: submissionPackage,
    });

    console.log(`✅ ${directory.name}: Package ready`);

    return {
      success: true,
      response_code: 200,
      response_body: submissionPackage,
    };
  } catch (error) {
    console.error(`❌ Error creating package for ${directory.name}:`, error);

    // Log failure
    await supabase.from('discovery_beacon_logs').insert({
      indexer_name: directory.name,
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

    // Generate submission packages for all directories
    const submissions = await Promise.all(
      directories.map((directory) => generateSubmissionPackage(directory, payload, supabase))
    );

    // Calculate summary
    const summary = {
      total: directories.length,
      successful: submissions.filter((s) => s.success).length,
      failed: submissions.filter((s) => !s.success).length,
      timestamp: new Date().toISOString(),
      note: 'Submission packages created. Visit each directory URL to manually submit.',
      results: directories.map((directory, i) => ({
        directory: directory.name,
        success: submissions[i].success,
        submission_url: directory.submission_url,
        method: directory.method,
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
