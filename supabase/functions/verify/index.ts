import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main verification function combining Perplexity and OpenAI
async function performVerification(content: string, contentType: string) {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!perplexityApiKey || !openaiApiKey) {
    throw new Error('API keys not configured properly');
  }

  let perplexityResult = '';
  let sources: any[] = [];

  try {
    console.log('Step 1: Calling Perplexity API for fact-checking...');
    
    // Call Perplexity API first for research and sources
    const perplexityPrompt = `Search and analyze the following content for factual accuracy: "${content}"

Provide comprehensive fact-checking with:
1. Factual accuracy assessment
2. Source verification
3. Supporting evidence
4. Contradicting evidence if any
5. Credible sources and citations

Focus on finding reliable sources and evidence to verify or debunk the claims.`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fact-checker. Provide detailed analysis with credible sources and citations.'
          },
          {
            role: 'user',
            content: perplexityPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month'
      }),
    });

    if (perplexityResponse.ok) {
      const perplexityData = await perplexityResponse.json();
      perplexityResult = perplexityData.choices[0]?.message?.content || '';
      sources = extractSourcesFromResponse(perplexityResult);
      console.log('Perplexity analysis completed successfully');
    } else {
      console.warn('Perplexity API failed, continuing with OpenAI only');
      perplexityResult = 'Initial research data unavailable - proceeding with direct analysis.';
    }
  } catch (error) {
    console.error('Perplexity API error:', error);
    perplexityResult = 'Research sources unavailable - using fallback analysis.';
  }

  try {
    console.log('Step 2: Calling OpenAI API for summary and confidence scoring...');
    
    // Call OpenAI API with Perplexity results for human-friendly summary
    const openaiPrompt = `Based on the following research evidence, provide a clear, human-friendly verification summary:

ORIGINAL CONTENT TO VERIFY: "${content}"

RESEARCH EVIDENCE FROM FACT-CHECKING:
${perplexityResult}

Please provide:
1. A confidence score from 0-100 (where 100 is completely verified, 0 is completely false)
2. A verification status: "Verified", "Flagged", or "Low Confidence"
3. A clear, easy-to-understand summary explaining your findings
4. Key supporting evidence

Format your response as JSON:
{
  "confidence": [number 0-100],
  "status": "[Verified|Flagged|Low Confidence]",
  "summary": "[human-friendly explanation]"
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at synthesizing fact-checking research into clear, actionable summaries. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: openaiPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const openaiContent = openaiData.choices[0]?.message?.content || '';
    
    console.log('OpenAI summary completed successfully');
    
    // Parse OpenAI JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(openaiContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON, extracting manually');
      // Fallback parsing
      const confidenceMatch = openaiContent.match(/confidence["\s:]*(\d+)/i);
      const statusMatch = openaiContent.match(/status["\s:]*["']([^"']+)["']/i);
      const summaryMatch = openaiContent.match(/summary["\s:]*["']([^"']+)["']/i);
      
      parsedResult = {
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
        status: statusMatch ? statusMatch[1] : 'Low Confidence',
        summary: summaryMatch ? summaryMatch[1] : 'Analysis completed with limited data.'
      };
    }

    return {
      confidence: Math.min(100, Math.max(0, parsedResult.confidence || 50)),
      status: parsedResult.status || 'Low Confidence',
      summary: parsedResult.summary || 'Verification analysis completed.',
      sources: sources.slice(0, 5) // Limit to 5 sources max
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback response if OpenAI fails
    return {
      confidence: 30,
      status: 'Low Confidence',
      summary: 'Unable to complete full verification due to technical limitations. Manual review recommended.',
      sources: sources.slice(0, 5)
    };
  }
}

// Extract sources from Perplexity response
function extractSourcesFromResponse(text: string) {
  const sources = [];
  
  // Extract URLs from the response
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const urls = text.match(urlRegex) || [];
  
  // Clean and deduplicate URLs
  const uniqueUrls = [...new Set(urls.map(url => url.replace(/[.,;)]*$/, '')))].slice(0, 5);
  
  uniqueUrls.forEach((url, index) => {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      sources.push({
        title: `${hostname.charAt(0).toUpperCase() + hostname.slice(1)} - Source ${index + 1}`,
        url: url
      });
    } catch (error) {
      console.error('Error parsing URL:', url);
    }
  });

  // If no sources found, add a default
  if (sources.length === 0) {
    sources.push({
      title: 'AI Analysis',
      url: '#'
    });
  }

  return sources;
}

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Verification request received');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request data
    const { content, user_id, content_type = 'text' } = await req.json();

    if (!content || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: content and user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing verification for user: ${user_id}, content type: ${content_type}`);

    // Perform the verification
    const result = await performVerification(content, content_type);
    
    // Save to Supabase verifications table
    const { data: verification, error: dbError } = await supabase
      .from('verifications')
      .insert({
        user_id,
        content,
        content_type,
        trust_score: result.confidence,
        status: result.status.toLowerCase(),
        result_summary: result.summary,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save verification result');
    }

    // Save sources if verification was created successfully
    if (verification && result.sources.length > 0) {
      const sourcesToInsert = result.sources.map(source => ({
        verification_id: verification.id,
        url: source.url,
        title: source.title,
        reliability_score: 85 // Default reliability score
      }));

      const { error: sourcesError } = await supabase
        .from('sources')
        .insert(sourcesToInsert);

      if (sourcesError) {
        console.error('Sources save error:', sourcesError);
      }
    }

    console.log('Verification completed successfully');

    // Return the result in the requested format
    const response = {
      confidence: result.confidence,
      status: result.status,
      summary: result.summary,
      sources: result.sources,
      created_at: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Verification failed',
        confidence: 0,
        status: 'Error',
        summary: 'Unable to complete verification due to technical error.',
        sources: [],
        created_at: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});