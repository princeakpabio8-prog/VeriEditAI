import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Azure configuration from environment
    const AZURE_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_DEPLOYMENT = Deno.env.get('AZURE_OPENAI_DEPLOYMENT');
    const AZURE_API_VERSION = Deno.env.get('AZURE_OPENAI_API_VERSION');

    if (!AZURE_API_KEY || !AZURE_ENDPOINT || !AZURE_DEPLOYMENT || !AZURE_API_VERSION) {
      console.error('❌ Missing Azure configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'Azure OpenAI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare content as array (Azure API expects array)
    const inputContent = Array.isArray(content) ? content : [content];
    
    console.log(`🔄 Generating embeddings for ${inputContent.length} text(s)...`);
    const startTime = Date.now();

    // Build Azure OpenAI embeddings URL
    const azureUrl = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/embeddings?api-version=${AZURE_API_VERSION}`;

    // Call Azure OpenAI Embeddings API
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'api-key': AZURE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: inputContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Azure API error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Azure API error: ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    // Extract embeddings from response
    const embeddings = data.data.map((item: any) => item.embedding);
    
    console.log(`✅ Generated ${embeddings.length} embeddings in ${processingTime}ms`);
    console.log(`📊 Embedding dimensions: ${embeddings[0]?.length || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        embeddings,
        dimensions: embeddings[0]?.length || 0,
        model: AZURE_DEPLOYMENT,
        processingTime,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in azure-generate-embedding:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
