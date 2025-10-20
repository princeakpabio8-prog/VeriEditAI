import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { badge_id, claim_text, trust_score, rarity_tier } = await req.json();
    
    if (!badge_id || !claim_text || !trust_score) {
      throw new Error('Missing required parameters');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`🎨 Generating NFT badge image for: ${badge_id}`);

    // Create a detailed prompt for high-quality NFT badge image
    const rarityColors = {
      'LEGENDARY': 'glowing gold and radiant orange with divine sparkles',
      'EPIC': 'vibrant purple and magenta with mystical aura',
      'RARE': 'brilliant blue and cyan with electric energy',
      'UNCOMMON': 'emerald green and teal with nature vibes',
      'COMMON': 'silver and white with clean elegance'
    };

    const color = rarityColors[rarity_tier as keyof typeof rarityColors] || rarityColors.COMMON;

    const prompt = `Create a premium NFT badge design for a truth verification certificate:
- Main theme: ${color}
- Style: Modern, sleek, professional with blockchain/tech aesthetic
- Include: Shield or badge shape with verification checkmark symbol
- Background: Gradient with subtle geometric patterns
- Add: Glowing effects, light particles, premium quality feel
- Trust score indicator showing ${trust_score}% confidence
- Text overlay: "VeriEdit Truth Badge" in elegant font
- Overall mood: Trustworthy, authoritative, high-value digital collectible
- Aspect ratio: Square (1:1), ultra high resolution, NFT-ready artwork`;

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
    console.log('📦 API Response received');
    
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error('❌ No image in response');
      throw new Error('No image generated - check API response structure');
    }

    console.log('✅ Image generated successfully');

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `badge-${badge_id}.png`;
    const filePath = `badges/${fileName}`;

    // Upload to nft-badge-images bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-badge-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
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
      .from('nft-badge-images')
      .getPublicUrl(filePath);

    console.log(`✅ Uploaded badge image to: ${publicUrl}`);

    // Update the NFT badge record with the image URL
    await supabase
      .from('nft_badges')
      .update({ 
        metadata_uri: publicUrl  // Update the metadata to point to the new image
      })
      .eq('id', badge_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: publicUrl,
        stored: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating NFT badge image:', error);
    
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
