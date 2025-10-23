import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const badges = [
      { rarity: 'legendary', fileName: 'legendary-badge.jpg' },
      { rarity: 'epic', fileName: 'epic-badge.jpg' },
      { rarity: 'rare', fileName: 'rare-badge.jpg' },
      { rarity: 'uncommon', fileName: 'uncommon-badge.jpg' },
      { rarity: 'common', fileName: 'common-badge.jpg' }
    ]

    const results = []

    for (const badge of badges) {
      try {
        // Fetch the badge image from the public folder
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/public/${badge.fileName}`
        const imageResponse = await fetch(imageUrl)
        
        if (!imageResponse.ok) {
          console.error(`Failed to fetch ${badge.fileName}:`, imageResponse.status)
          results.push({
            rarity: badge.rarity,
            success: false,
            error: `Failed to fetch image: ${imageResponse.status}`
          })
          continue
        }
        
        const imageBlob = await imageResponse.blob()
        
        // Upload to nft-badge-images bucket with rarity-based naming
        const targetFileName = `${badge.rarity}-truth-badge.jpg`
        const { data, error } = await supabase.storage
          .from('nft-badge-images')
          .upload(targetFileName, imageBlob, {
            contentType: 'image/jpeg',
            upsert: true
          })
        
        if (error) {
          console.error(`Upload error for ${badge.rarity}:`, error)
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
        
        results.push({
          rarity: badge.rarity,
          success: true,
          url: publicUrl.publicUrl,
          fileName: targetFileName
        })
        
        console.log(`✅ Uploaded ${badge.rarity} badge:`, publicUrl.publicUrl)
      } catch (err: any) {
        console.error(`Error processing ${badge.rarity}:`, err)
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
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
