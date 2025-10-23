import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage, verificationId } = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, targetLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache for existing translation
    const { data: cached } = await supabase
      .from('content_translations')
      .select('*')
      .eq('original_text', text)
      .eq('target_language', targetLanguage)
      .single();

    if (cached) {
      console.log('Cache hit for translation');
      return new Response(
        JSON.stringify({
          translatedText: cached.translated_text,
          sourceLanguage: cached.source_language,
          fromCache: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI for translation
    console.log(`Translating to ${targetLanguage}`);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. Maintain the original tone, intent, and meaning. Only respond with the translated text, nothing else. Also detect the source language.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    // Detect source language using a second call (lightweight)
    const detectResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., "en", "es", "nl", "fr").'
          },
          {
            role: 'user',
            content: text.substring(0, 200) // Only send first 200 chars for detection
          }
        ],
        max_completion_tokens: 10,
      }),
    });

    const detectData = await detectResponse.json();
    const sourceLanguage = detectData.choices[0].message.content.trim().toLowerCase();

    // Cache the translation
    await supabase
      .from('content_translations')
      .insert({
        verification_id: verificationId || null,
        original_text: text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translated_text: translatedText
      });

    console.log(`Translation successful: ${sourceLanguage} -> ${targetLanguage}`);

    return new Response(
      JSON.stringify({
        translatedText,
        sourceLanguage,
        fromCache: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in translate-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
