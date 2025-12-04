import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Embedded badge image URLs from the deployed app
// These are the colorful shield designs that should be used
const BADGE_SOURCE_URLS = {
  legendary: 'https://id-preview--b0c0de30-1919-4318-9eb7-777a5cf085b4.lovable.app/badges/legendary-badge.jpg',
  epic: 'https://id-preview--b0c0de30-1919-4318-9eb7-777a5cf085b4.lovable.app/badges/epic-badge.jpg',
  rare: 'https://id-preview--b0c0de30-1919-4318-9eb7-777a5cf085b4.lovable.app/badges/rare-badge.jpg',
  uncommon: 'https://id-preview--b0c0de30-1919-4318-9eb7-777a5cf085b4.lovable.app/badges/uncommon-badge.jpg',
  common: 'https://id-preview--b0c0de30-1919-4318-9eb7-777a5cf085b4.lovable.app/badges/common-badge.jpg'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🚀 Starting badge template upload from deployed app...')
    
    const badges = [
      { rarity: 'legendary', sourceUrl: BADGE_SOURCE_URLS.legendary },
      { rarity: 'epic', sourceUrl: BADGE_SOURCE_URLS.epic },
      { rarity: 'rare', sourceUrl: BADGE_SOURCE_URLS.rare },
      { rarity: 'uncommon', sourceUrl: BADGE_SOURCE_URLS.uncommon },
      { rarity: 'common', sourceUrl: BADGE_SOURCE_URLS.common }
    ]

    const results = []

    for (const badge of badges) {
      try {
        console.log(`📥 Fetching ${badge.rarity} badge from: ${badge.sourceUrl}`)
        
        const imageResponse = await fetch(badge.sourceUrl, {
          headers: {
            'Accept': 'image/*'
          }
        })
        
        if (!imageResponse.ok) {
          console.error(`❌ Failed to fetch ${badge.rarity}:`, imageResponse.status, await imageResponse.text())
          results.push({
            rarity: badge.rarity,
            success: false,
            error: `Failed to fetch image: ${imageResponse.status}`
          })
          continue
        }
        
        const imageBlob = await imageResponse.blob()
        console.log(`📦 Downloaded ${badge.rarity} badge: ${imageBlob.size} bytes, type: ${imageBlob.type}`)
        
        // Verify it's actually an image
        if (!imageBlob.type.startsWith('image/') && imageBlob.size < 1000) {
          console.error(`❌ ${badge.rarity} is not a valid image (size: ${imageBlob.size}, type: ${imageBlob.type})`)
          results.push({
            rarity: badge.rarity,
            success: false,
            error: `Invalid image data: ${imageBlob.type}, ${imageBlob.size} bytes`
          })
          continue
        }
        
        // Upload to nft-badge-images bucket with rarity-based naming
        const targetFileName = `${badge.rarity}-truth-badge.jpg`
        
        // Delete existing file first to ensure clean upload
        await supabase.storage
          .from('nft-badge-images')
          .remove([targetFileName])
        
        const { data, error } = await supabase.storage
          .from('nft-badge-images')
          .upload(targetFileName, imageBlob, {
            contentType: imageBlob.type || 'image/jpeg',
            upsert: true,
            cacheControl: '31536000' // Cache for 1 year
          })
        
        if (error) {
          console.error(`❌ Upload error for ${badge.rarity}:`, error)
          results.push({
            rarity: badge.rarity,
            success: false,
            error: error.message
          })
          continue
        }
        
        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from('nft-badge-images')
          .getPublicUrl(targetFileName)
        
        // Verify the uploaded image is accessible
        const verifyResponse = await fetch(publicUrl.publicUrl, { method: 'HEAD' })
        if (!verifyResponse.ok) {
          console.error(`❌ Verification failed for ${badge.rarity}:`, verifyResponse.status)
          results.push({
            rarity: badge.rarity,
            success: false,
            error: `Upload verification failed: ${verifyResponse.status}`
          })
          continue
        }
        
        results.push({
          rarity: badge.rarity,
          success: true,
          url: publicUrl.publicUrl,
          fileName: targetFileName,
          size: imageBlob.size
        })
        
        console.log(`✅ Uploaded ${badge.rarity} badge: ${publicUrl.publicUrl}`)
      } catch (err: any) {
        console.error(`❌ Error processing ${badge.rarity}:`, err)
        results.push({
          rarity: badge.rarity,
          success: false,
          error: err.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    
    return new Response(
      JSON.stringify({
        success: successCount === badges.length,
        message: `Uploaded ${successCount}/${badges.length} badge templates`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('❌ Upload error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
