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
    
    console.log('🎨 [DEPRECATED] NFT Badge Image Generation Request:', { badge_id, claim_text, trust_score, rarity_tier });
    console.warn('⚠️ This function is deprecated. All badges now use Canva templates.');
    
    if (!badge_id) {
      throw new Error('badge_id is required');
    }

    // Check if badge already uses Canva template
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: badge } = await supabase
      .from('nft_badges')
      .select('metadata_uri')
      .eq('id', badge_id)
      .single();

    if (badge?.metadata_uri) {
      const fileName = badge.metadata_uri.split('/').pop();
      if (fileName) {
        const { data: metadataFile } = await supabase.storage
          .from('nft-metadata')
          .download(fileName);
        
        if (metadataFile) {
          const metadata = JSON.parse(await metadataFile.text());
          const isCanvaTemplate = metadata.image?.includes('truth-badge.jpg');
          
          if (isCanvaTemplate) {
            console.log('✅ Badge already uses Canva template - skipping AI generation');
            return new Response(
              JSON.stringify({ 
                success: true,
                message: 'Badge already uses Canva template',
                image_url: metadata.image
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // OpenAI is no longer used - return message
    console.warn('⚠️ OpenAI generation disabled. Use Canva templates instead.');
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'AI generation is deprecated',
        message: 'This badge system now uses Canva templates exclusively. No AI generation needed.'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

    // Create ultra-premium 3D cinematic prompts for each rarity tier
    const rarityPrompts = {
      'LEGENDARY': `Ultra-premium 3D NFT badge, cinematic 8K quality, volumetric lighting:

CENTER BADGE:
- Majestic hovering golden shield, floating 30° angle
- Giant 3D chrome verification checkmark, raised 2cm from surface
- Ornate beveled edges with mirror-polished gold reflections
- Photorealistic brushed gold metal texture with caustic light patterns
- Glowing holographic "VeriEdit Truth Badge" text floating above
- Trust Score ${trust_score}% in bright golden holographic numbers

DRAMATIC LIGHTING:
- Three professional studio lights with golden accent beams
- Ray-traced reflections creating lens flares and star bursts
- Volumetric god rays penetrating mystical fog particles
- Swirling phoenix fire trails encircling the badge
- Golden energy wisps and celestial sparkles floating around
- Divine radiant aura with atmospheric light scattering

CINEMATIC BACKGROUND:
- Deep black to molten gold gradient backdrop
- Faded sacred geometry mandala pattern (subtle)
- Shallow depth of field with smooth bokeh circles
- Atmospheric smoke illuminated by backlighting

RENDER SPECS: Unreal Engine 5 / Octane quality, PBR materials, 8K resolution, museum-grade collectible NFT`,

      'EPIC': `Ultra-premium 3D NFT badge, cinematic 8K quality, volumetric lighting:

CENTER BADGE:
- Mystical floating purple holographic shield, tilted 25° perspective
- Giant 3D platinum verification checkmark, raised embossed design
- Beveled edges with iridescent color-shifting reflections
- Holographic material showing rainbow caustic light patterns
- Glowing "VeriEdit Truth Badge" text in futuristic metallic font
- Trust Score ${trust_score}% in bright purple holographic display

DRAMATIC LIGHTING:
- Professional studio lighting with purple and magenta accent beams
- Ray-traced reflections creating magical shimmer effects
- Volumetric purple mist with penetrating light rays
- Three glowing orbital rings rotating cinematically around badge
- Mystical glowing runes etched into shield surface
- Floating purple crystal shards and energy wisps

CINEMATIC BACKGROUND:
- Deep black to vibrant purple/magenta gradient backdrop
- Faded arcane symbols pattern (very subtle)
- Shallow depth of field with mystical bokeh
- Ethereal atmospheric fog with purple glow

RENDER SPECS: Unreal Engine 5 quality, holographic PBR shaders, 8K resolution, masterwork NFT collectible`,

      'RARE': `Ultra-premium 3D NFT badge, cinematic 8K quality, volumetric lighting:

CENTER BADGE:
- Electric blue chrome floating shield, dramatic 20° angle
- Giant 3D titanium verification checkmark, deeply embossed
- Beveled edges with electric blue reflections
- Polished chrome metal with photorealistic specularity
- Glowing "VeriEdit Truth Badge" text in sleek tech font
- Trust Score ${trust_score}% in bright electric blue holographic numbers

DRAMATIC LIGHTING:
- Professional studio lighting with electric blue accent beams
- Ray-traced reflections with blue lens flares
- Volumetric blue energy field sphere surrounding entire badge
- Crackling lightning bolts arcing around edges
- Neon glow with intense light bloom effect
- Electric sparks and energy trail particles

CINEMATIC BACKGROUND:
- Deep black to electric blue gradient backdrop
- Faded circuit board pattern (subtle)
- Shallow depth of field with blue bokeh circles
- Atmospheric fog with blue backlighting

RENDER SPECS: Unreal Engine 5 quality, chrome PBR materials, 8K resolution, elite NFT collectible`,

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
        output_format: "png",
        quality: "high", // High quality for cinematic 3D NFTs
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
