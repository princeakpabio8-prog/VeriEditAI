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
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.error('❌ OPENAI_API_KEY not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔧 Fixing badge image URLs...')
    
    // Get all badges
    const { data: badges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('id, metadata_uri, claim_text, trust_score, rarity_tier')
      .not('metadata_uri', 'is', null)
    
    if (fetchError) throw fetchError
    
    let fixed = 0
    let failed = 0
    let skipped = 0
    
    const correctFallbackUrl = `${supabaseUrl}/storage/v1/object/public/nft-badge-images/truth-badge-template.png`
    const brokenUrlPattern = 'lovableproject.com/nft-badge-fallback.png'
    
    for (const badge of badges || []) {
      try {
        const fileName = badge.metadata_uri.split('/').pop()
        if (!fileName) {
          console.log(`⏭️ Skipping ${badge.id} - invalid metadata URI`)
          skipped++
          continue
        }
        
        // Download current metadata
        const { data: metadataFile, error: downloadError } = await supabase.storage
          .from('nft-metadata')
          .download(fileName)
        
        if (downloadError) {
          console.log(`⏭️ Skipping ${badge.id} - metadata not accessible`)
          skipped++
          continue
        }
        
        const metadataText = await metadataFile.text()
        const metadata = JSON.parse(metadataText)
        
        // Check if image URL is broken
        if (metadata.image && metadata.image.includes(brokenUrlPattern)) {
          console.log(`🔨 Fixing badge ${badge.id} - broken image URL detected`)
          
          // Update metadata with correct fallback URL
          const updatedMetadata = {
            ...metadata,
            image: correctFallbackUrl
          }
          
          // Upload updated metadata
          const { error: uploadError } = await supabase.storage
            .from('nft-metadata')
            .update(fileName, JSON.stringify(updatedMetadata, null, 2), {
              contentType: 'application/json',
              upsert: true
            })
          
          if (uploadError) {
            console.error(`❌ Failed to update metadata for ${badge.id}:`, uploadError)
            failed++
          } else {
            console.log(`✅ Fixed metadata for badge ${badge.id}`)
            
            // Now trigger AI image generation
            const { error: genError } = await supabase.functions.invoke('generate-nft-badge-image', {
              body: {
                badge_id: badge.id,
                claim_text: badge.claim_text || 'Truth verification badge',
                trust_score: badge.trust_score || 75,
                rarity_tier: badge.rarity_tier || 'COMMON'
              }
            })
            
            if (genError) {
              console.error(`⚠️ AI generation queued with warning for ${badge.id}:`, genError)
            } else {
              console.log(`🎨 AI generation triggered for badge ${badge.id}`)
            }
            
            fixed++
          }
          
          // Rate limit: wait between updates
          await new Promise(r => setTimeout(r, 500))
        } else {
          console.log(`✓ Badge ${badge.id} already has valid image URL`)
          skipped++
        }
      } catch (err) {
        console.error(`❌ Error processing badge ${badge.id}:`, err)
        failed++
      }
    }
    
    const summary = {
      total: badges?.length || 0,
      fixed,
      failed,
      skipped,
      message: `Fixed ${fixed} badges, ${failed} failed, ${skipped} skipped`
    }
    
    console.log('✅ Fix process complete:', summary)
    
    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('❌ Fix process error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
