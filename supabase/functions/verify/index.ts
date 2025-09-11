// Supabase Edge Function: /verify
// Chained Verification Engine (Perplexity + GPT + Supabase)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Env Vars
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

// Init Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, user_id } = await req.json();

    if (!content || !user_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing verification for user: ${user_id}`);

    // Step 1: Call Perplexity API
    console.log('Step 1: Calling Perplexity API...');
    const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a fact-checking expert. Analyze the given content and provide evidence-based verification with credible sources."
          },
          {
            role: "user", 
            content: `Fact-check this content and provide sources: ${content}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month'
      }),
    });

    let perplexityData: any = null;
    let sources: any[] = [];
    
    if (perplexityRes.ok) {
      perplexityData = await perplexityRes.json();
      console.log('Perplexity API call successful');
      
      // Extract sources from Perplexity response text
      const perplexityText = perplexityData?.choices?.[0]?.message?.content || '';
      const urlRegex = /https?:\/\/[^\s\)]+/g;
      const urls = perplexityText.match(urlRegex) || [];
      
      sources = [...new Set(urls)].slice(0, 5).map((url: string, index: number) => {
        try {
          const hostname = new URL(url).hostname.replace('www.', '');
          return {
            title: `${hostname.charAt(0).toUpperCase() + hostname.slice(1)} - Source ${index + 1}`,
            url: url.replace(/[.,;)]*$/, '') // Clean trailing punctuation
          };
        } catch {
          return {
            title: `Source ${index + 1}`,
            url: url
          };
        }
      });
    } else {
      console.warn('Perplexity API failed, continuing with OpenAI only');
      perplexityData = { error: 'Perplexity API unavailable' };
    }

    // Step 2: Call GPT API with Perplexity evidence
    console.log('Step 2: Calling OpenAI API...');
    const gptPrompt = `
You are VeriEdit AI, an expert content verification assistant. Analyze this content and provide a comprehensive fact-check report.

Content to verify: "${content}"

Research Evidence: ${JSON.stringify(perplexityData)}

Available Sources: ${JSON.stringify(sources)}

Provide your response in this EXACT format:

**CONFIDENCE SCORE: [0-100]%**

**VERIFICATION STATUS: [VERIFIED/FLAGGED/INCONCLUSIVE]**

**EXECUTIVE SUMMARY:**
[2-3 sentence summary of your findings]

**DETAILED ANALYSIS:**
[Thorough analysis of the content, explaining what you found, what sources support or contradict the claims, and your reasoning]

**SOURCES & CITATIONS:**
${sources.map((source, idx) => `${idx + 1}. ${source.title} - ${source.url}`).join('\n')}

**RECOMMENDATIONS:**
[What actions should be taken based on your findings]

Make your analysis thorough, evidence-based, and cite specific sources when making claims.
`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          {
            role: "system",
            content: "You are VeriEdit AI, an expert content verification assistant. Provide comprehensive, well-structured verification reports with proper citations and evidence-based analysis."
          },
          {
            role: "user", 
            content: gptPrompt
          }
        ],
        temperature: 0.1,
        max_completion_tokens: 2000
      }),
    });

    const gptData = await gptRes.json();
    console.log('GPT Response:', JSON.stringify(gptData, null, 2));
    
    const gptText = gptData.choices?.[0]?.message?.content || "No summary available";
    console.log('GPT Text:', gptText);
    
    console.log('OpenAI API call successful');

    // Simple parsing: look for confidence number
    const confidenceMatch = gptText.match(/(\d{1,3})%/) || gptText.match(/confidence[:\s]*(\d{1,3})/i);
    const confidence = confidenceMatch
      ? Math.min(100, parseInt(confidenceMatch[1]))
      : 70;

    let status = "completed";
    if (confidence >= 80) status = "completed";
    else if (confidence < 65) status = "completed";

    const result = {
      confidence,
      status,
      summary: gptText,
      sources,
      created_at: new Date().toISOString(),
    };

    // Step 3: Save to Supabase
    console.log('Step 3: Saving to Supabase...');
    const { data: verification, error: dbError } = await supabase
      .from("verifications")
      .insert({
        user_id,
        content,
        content_type: 'text',
        trust_score: confidence,
        status: status,
        result_summary: gptText,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save verification result');
    }

    // Save sources if verification was created successfully
    if (verification && sources.length > 0) {
      const sourcesToInsert = sources.map(source => ({
        verification_id: verification.id,
        url: source.url,
        title: source.title,
        reliability_score: 85
      }));

      const { error: sourcesError } = await supabase
        .from('sources')
        .insert(sourcesToInsert);

      if (sourcesError) {
        console.error('Sources save error:', sourcesError);
      }
    }

    console.log('Verification completed successfully');

    // Step 4: Return to frontend
    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error("Error in /verify:", err);
    return new Response(JSON.stringify({ 
      error: err.message,
      confidence: 0,
      status: 'error',
      summary: 'Verification failed due to technical error.',
      sources: [],
      created_at: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});