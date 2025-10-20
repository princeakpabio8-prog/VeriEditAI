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
    
    console.log('🔧 Starting NFT badge image fix process...')
    
    // Get all badges with broken template image references
    const { data: badges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('id, metadata_uri, claim_text, trust_score, rarity_tier')
      .not('metadata_uri', 'is', null)
    
    if (fetchError) throw fetchError
    
    let fixed = 0
    let failed = 0
    let skipped = 0
    
    for (const badge of badges || []) {
      try {
        // Fetch the metadata
        const metadataResponse = await fetch(badge.metadata_uri)
        if (!metadataResponse.ok) {
          console.log(`⏭️ Skipping ${badge.id} - metadata not accessible`)
          skipped++
          continue
        }
        
        const metadata = await metadataResponse.json()
        
        // Check if image is the broken template or missing
        if (!metadata.image || metadata.image.includes('truth-badge-template.png')) {
          console.log(`🔨 Fixing badge ${badge.id}...`)
          
          // Generate new OpenAI image
          const { error: genError } = await supabase.functions.invoke('generate-nft-badge-image', {
            body: {
              badge_id: badge.id,
              claim_text: badge.claim_text || 'Truth verification badge',
              trust_score: badge.trust_score || 75,
              rarity_tier: badge.rarity_tier || 'COMMON'
            }
          })
          
          if (genError) {
            console.error(`❌ Failed to generate image for ${badge.id}:`, genError)
            failed++
          } else {
            console.log(`✅ Fixed image for badge ${badge.id}`)
            fixed++
          }
          
          // Rate limit: wait between generations
          await new Promise(r => setTimeout(r, 1000))
        } else {
          console.log(`✓ Badge ${badge.id} already has valid image`)
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
