import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, verificationId } = await req.json();
    
    if (!content || !verificationId) {
      throw new Error('Content and verificationId are required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Analyze sentiment and extract entities using GPT-4o-mini (fast + cheap)
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert content analyzer. Analyze the given content and return:
1. Sentiment score (-1.0 to 1.0)
2. Sentiment label (positive/negative/neutral/mixed)
3. Claim type (factual/opinion/statistical/prediction)
4. Detected entities (persons, organizations, locations, topics)

Return ONLY valid JSON with this structure:
{
  "sentiment_score": number,
  "sentiment_label": string,
  "claim_type": string,
  "entities": {
    "persons": string[],
    "organizations": string[],
    "locations": string[],
    "topics": string[]
  }
}`
          },
          {
            role: 'user',
            content: `Analyze this content:\n\n${content.substring(0, 4000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('OpenAI API error:', analysisResponse.status, errorText);
      throw new Error(`OpenAI API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisText);
      throw new Error('Invalid analysis format from AI');
    }

    // Update verification with analysis results
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseClient
      .from('verifications')
      .update({
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        claim_type: analysis.claim_type,
        detected_entities: analysis.entities,
      })
      .eq('id', verificationId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          sentiment_score: analysis.sentiment_score,
          sentiment_label: analysis.sentiment_label,
          claim_type: analysis.claim_type,
          entities: analysis.entities,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Content analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});