import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claim_text, viral_claim_id } = await req.json();
    
    if (!claim_text) {
      throw new Error('Claim text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`🎨 Generating image for claim: ${claim_text.substring(0, 100)}...`);

    // Simplified prompt for faster generation
    const prompt = `News image for: ${claim_text.substring(0, 150)}. Modern, clean, 16:9, no text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API error (${response.status}):`, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 API Response structure:', JSON.stringify(data, null, 2));
    
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error('❌ No image in response. Full data:', JSON.stringify(data, null, 2));
      throw new Error('No image generated - check API response structure');
    }

    console.log('✅ Image generated successfully');

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `claim-${viral_claim_id || Date.now()}.png`;
    const filePath = `viral-claims/${fileName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Return base64 as fallback
      return new Response(
        JSON.stringify({ 
          success: true, 
          image_url: imageBase64,
          stored: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('public-images')
      .getPublicUrl(filePath);

    // Update viral claim with image URL (non-blocking background task)
    if (viral_claim_id) {
      // Fire and forget - don't wait for update
      supabase
        .from('viral_claims')
        .update({ image_url: publicUrl })
        .eq('id', viral_claim_id)
        .then(() => console.log(`✅ Updated claim ${viral_claim_id}`))
        .catch(e => console.error('Update error:', e));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: publicUrl,
        stored: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating claim image:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      viral_claim_id
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
