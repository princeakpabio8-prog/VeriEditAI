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

    console.log(`🎨 Generating image for claim: ${claim_text.substring(0, 50)}...`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate a visual representation of the claim
    const prompt = `Create a professional news-style image representing this claim: "${claim_text}". 
    Style: Modern, clean, journalistic. No text overlays. 16:9 aspect ratio. 
    Focus on visual metaphors and symbolic representation.`;

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

    const data = await response.json();
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('Failed to generate image');
    }

    console.log(`✅ Image generated successfully`);

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

    console.log(`📸 Image uploaded to: ${publicUrl}`);

    // Update viral claim with image URL
    if (viral_claim_id) {
      await supabase
        .from('viral_claims')
        .update({ image_url: publicUrl })
        .eq('id', viral_claim_id);
      
      console.log(`✅ Updated viral claim ${viral_claim_id} with image`);
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
    console.error('Error generating claim image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
