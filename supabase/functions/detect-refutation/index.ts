import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
    const { claim, answer, sources } = await req.json();
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
    const systemPrompt = `You are an expert fact-checker analyzing whether a verification answer refutes a claim.

CRITICAL RULES:
1. A refutation means the answer CONTRADICTS the main factual assertion of the claim
2. Negation words ("not", "no") are NOT automatically refutations - context matters
3. If sources CONFIRM the claim, it's NOT a refutation, even if negation words exist
4. "Lecornu was not fired" is NOT a refutation of "Macron reappointed Lecornu" - both can be true
5. Only mark as refutation if the answer explicitly contradicts the core claim

EXAMPLES:
- Claim: "Macron reappointed Lecornu as PM"
  Answer: "Macron reappointed Lecornu after his resignation"
  Result: NOT a refutation (confirms the claim)

- Claim: "Macron reappointed Lecornu as PM"
  Answer: "This claim is false. Lecornu was never reappointed. Macron appointed a different person."
  Result: IS a refutation (directly contradicts)`;

    const userPrompt = `Analyze this claim and verification answer:

CLAIM: "${claim}"

ANSWER: "${answer}"

SOURCE CONSENSUS: ${sources.count} sources with average reliability ${sources.avg_reliability}%

Determine if the answer refutes the claim.`;

    console.log('🔍 Analyzing refutation with Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_refutation",
            description: "Determine if the answer refutes the claim",
            parameters: {
              type: "object",
              properties: {
                is_refutation: { 
                  type: "boolean",
                  description: "True if answer contradicts the main claim"
                },
                confidence: { 
                  type: "number",
                  description: "Confidence in refutation detection (0-100)"
                },
                reasoning: { 
                  type: "string",
                  description: "Explain why this is or isn't a refutation"
                },
                refutation_type: { 
                  type: "string",
                  enum: ["direct", "partial", "none"],
                  description: "Type of refutation detected"
                }
              },
              required: ["is_refutation", "confidence", "reasoning", "refutation_type"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_refutation" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }
    
    const result = JSON.parse(toolCall.function.arguments);
    
    console.log(`✅ Refutation analysis: ${result.is_refutation ? 'REFUTED' : 'NOT REFUTED'} (${result.confidence}% confidence)`);
    console.log(`📝 Reasoning: ${result.reasoning}`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in detect-refutation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        is_refutation: false,
        confidence: 0,
        reasoning: 'Error during analysis - defaulting to no refutation',
        refutation_type: 'none'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
