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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log(`🎨 Generating NFT badge image for: ${badge_id} (Rarity: ${rarity_tier}, Trust: ${trust_score}%)`);

    // Create ultra-premium 3D cinematic prompts for each rarity tier
    const rarityPrompts = {
      'LEGENDARY': `Ultra-premium 3D rendered NFT badge, photorealistic cinema quality 8K:

MAIN OBJECT:
- Majestic golden metallic shield with divine radiance
- Deep embossed verification checkmark (3D raised chrome element)
- Ornate beveled edges with mirror-polished reflections
- Brushed gold texture with realistic specularity and caustics
- Floating holographic text: "VeriEdit Truth Badge" in elegant metallic serif font
- Trust Score: ${trust_score}% displayed as glowing holographic numerals

LIGHTING & EFFECTS:
- Dramatic studio lighting (3-point cinematic setup)
- Ray-traced reflections with lens flares and chromatic aberration
- Volumetric god rays piercing through ethereal fog
- Phoenix fire particles swirling around badge
- Golden energy wisps and celestial sparkles
- Divine aura with light scattering effects

BACKGROUND:
- Dark cinematic gradient (near-black to deep molten gold)
- Subtle sacred geometry pattern (faded golden mandala)
- Depth of field blur with bokeh effect
- Atmospheric smoke with dramatic backlighting

TECHNICAL:
- 8K resolution, ultra-detailed, photorealistic
- PBR materials (physically-based rendering)
- Octane Render / Unreal Engine 5 cinematic quality
- Premium NFT collectible aesthetic, museum-quality presentation`,

      'EPIC': `Ultra-premium 3D rendered NFT badge, photorealistic cinema quality 8K:

MAIN OBJECT:
- Mystical purple holographic shield with iridescent sheen
- Deep embossed verification checkmark (3D raised platinum element)
- Beveled edges with color-shifting reflections
- Holographic material with rainbow caustics
- Floating metallic text: "VeriEdit Truth Badge" in elegant futuristic font
- Trust Score: ${trust_score}% displayed as glowing purple numerals

LIGHTING & EFFECTS:
- Dramatic studio lighting with purple accent lights
- Ray-traced reflections with magical shimmer
- Volumetric purple mist with light rays
- Magical orbital rings rotating around badge
- Mystical runes etched into surface with glow effect
- Particle effects: floating purple crystals and energy wisps

BACKGROUND:
- Dark cinematic gradient (near-black to deep purple/magenta)
- Subtle arcane symbols pattern (faded)
- Depth of field blur with mystical bokeh
- Atmospheric fog with ethereal glow

TECHNICAL:
- 8K resolution, ultra-detailed, photorealistic
- PBR materials with holographic shaders
- Octane Render / Unreal Engine 5 cinematic quality
- Premium NFT collectible aesthetic, masterwork presentation`,

      'RARE': `Ultra-premium 3D rendered NFT badge, photorealistic cinema quality 8K:

MAIN OBJECT:
- Electric blue chrome shield with metallic sheen
- Deep embossed verification checkmark (3D raised titanium element)
- Beveled edges with electric reflections
- Polished chrome texture with realistic specularity
- Floating metallic text: "VeriEdit Truth Badge" in elegant tech font
- Trust Score: ${trust_score}% displayed as glowing blue numerals

LIGHTING & EFFECTS:
- Dramatic studio lighting with electric blue accents
- Ray-traced reflections with lens flares
- Volumetric blue energy field surrounding badge
- Lightning bolt effects crackling around edges
- Neon glow with light bloom
- Particle effects: electric sparks and energy trails

BACKGROUND:
- Dark cinematic gradient (near-black to deep electric blue)
- Subtle circuit pattern (faded)
- Depth of field blur with bokeh effect
- Atmospheric fog with blue backlighting

TECHNICAL:
- 8K resolution, ultra-detailed, photorealistic
- PBR materials (physically-based rendering)
- Octane Render / Unreal Engine 5 cinematic quality
- Premium NFT collectible aesthetic, elite presentation`,

      'UNCOMMON': `Ultra-premium 3D rendered NFT badge, photorealistic cinema quality 8K:

MAIN OBJECT:
- Brushed gold/emerald metallic shield with nature-inspired accents
- Deep embossed verification checkmark (3D raised bronze element)
- Beveled edges with warm reflections
- Brushed metal texture with green accent highlights
- Floating metallic text: "VeriEdit Truth Badge" in elegant serif font
- Trust Score: ${trust_score}% displayed as glowing green numerals

LIGHTING & EFFECTS:
- Studio lighting with warm green accent lights
- Ray-traced reflections with natural shimmer
- Volumetric green energy wisps
- Nature-inspired particle effects: floating leaves and sparkles
- Subtle growth patterns etched into surface
- Soft glow with organic feel

BACKGROUND:
- Dark cinematic gradient (near-black to deep emerald/teal)
- Subtle organic pattern (faded nature motifs)
- Depth of field blur with natural bokeh
- Atmospheric mist with green tint

TECHNICAL:
- 8K resolution, ultra-detailed, photorealistic
- PBR materials (physically-based rendering)
- Octane Render / Unreal Engine 5 cinematic quality
- Premium NFT collectible aesthetic, distinguished presentation`,

      'COMMON': `Ultra-premium 3D rendered NFT badge, photorealistic cinema quality 8K:

MAIN OBJECT:
- Polished silver/platinum metallic shield with clean design
- Deep embossed verification checkmark (3D raised chrome element)
- Beveled edges with mirror reflections
- Brushed platinum texture with realistic specularity
- Floating metallic text: "VeriEdit Truth Badge" in elegant modern font
- Trust Score: ${trust_score}% displayed as glowing white numerals

LIGHTING & EFFECTS:
- Clean studio lighting (3-point professional setup)
- Ray-traced reflections with subtle lens flares
- Volumetric white light rays
- Minimal particle effects: floating light motes
- Subtle blockchain pattern etched into surface
- Professional glow with clean aesthetic

BACKGROUND:
- Dark cinematic gradient (near-black to deep silver)
- Subtle geometric grid pattern (faded)
- Depth of field blur with clean bokeh
- Atmospheric fog with soft backlighting

TECHNICAL:
- 8K resolution, ultra-detailed, photorealistic
- PBR materials (physically-based rendering)
- Octane Render / Unreal Engine 5 cinematic quality
- Premium NFT collectible aesthetic, certified presentation`
    };

    const prompt = rarityPrompts[rarity_tier as keyof typeof rarityPrompts] || rarityPrompts.COMMON;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "high",
        n: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error (${response.status}):`, errorText);
      console.error(`❌ Full error details:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 OpenAI Response received');
    
    const imageBase64 = data.data?.[0]?.b64_json;

    if (!imageBase64) {
      console.error('❌ No image in OpenAI response');
      throw new Error('No image generated by OpenAI');
    }

    console.log('✅ Image generated successfully');

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to buffer (no data URI prefix for OpenAI b64_json)
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    
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

    // Get the NFT badge record to access metadata_uri
    const { data: badgeRecord, error: badgeError } = await supabase
      .from('nft_badges')
      .select('metadata_uri')
      .eq('id', badge_id)
      .single();

    if (badgeError || !badgeRecord) {
      console.error('❌ Could not find badge record');
      return new Response(
        JSON.stringify({ 
          success: true, 
          image_url: publicUrl,
          stored: true,
          metadata_updated: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the existing metadata JSON
    const metadataResponse = await fetch(badgeRecord.metadata_uri);
    if (!metadataResponse.ok) {
      console.error('❌ Could not fetch existing metadata');
      return new Response(
        JSON.stringify({ 
          success: true, 
          image_url: publicUrl,
          stored: true,
          metadata_updated: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingMetadata = await metadataResponse.json();
    
    // Update the image URL in the metadata
    existingMetadata.image = publicUrl;
    
    // Re-upload the updated metadata
    const metadataFileName = badgeRecord.metadata_uri.split('/').pop();
    const { error: metadataError } = await supabase.storage
      .from('nft-metadata')
      .update(metadataFileName, JSON.stringify(existingMetadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (metadataError) {
      console.error('❌ Failed to update metadata:', metadataError);
    } else {
      console.log('✅ Metadata updated with new image URL');
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
