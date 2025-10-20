import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('[Auto-Repair] Starting automated badge health check...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Check for badges with token_id = 0 (broken OpenSea links)
    const { data: brokenBadges, error: queryError } = await supabase
      .from('nft_badges')
      .select('id, token_id, verification_id')
      .eq('token_id', '0')

    if (queryError) {
      console.error('[Auto-Repair] Query error:', queryError)
      throw queryError
    }

    console.log(`[Auto-Repair] Found ${brokenBadges?.length || 0} badges with token_id=0`)

    let fixed = 0
    let failed = 0

    if (brokenBadges && brokenBadges.length > 0) {
      console.log('[Auto-Repair] Triggering token ID fix...')
      
      const { data: fixResult, error: fixError } = await supabase.functions.invoke('fix-token-ids')
      
      if (fixError) {
        console.error('[Auto-Repair] Token ID fix failed:', fixError)
        failed = brokenBadges.length
      } else {
        console.log('[Auto-Repair] Token ID fix result:', fixResult)
        fixed = fixResult?.fixed || 0
        
        // After fixing token IDs, sync with OpenSea
        console.log('[Auto-Repair] Syncing with OpenSea...')
        await supabase.functions.invoke('sync-opensea-collection')
      }
    }

    // Check for badges with template images
    const { data: templateBadges, error: templateError } = await supabase
      .from('nft_badges')
      .select('id, metadata_uri, claim_text, trust_score, rarity_tier')
      .like('metadata_uri', '%nft-badge-template%')
      .limit(50)

    if (templateError) {
      console.error('[Auto-Repair] Template badge query error:', templateError)
    }

    console.log(`[Auto-Repair] Found ${templateBadges?.length || 0} badges with template images`)

    let imagesTriggered = 0

    if (templateBadges && templateBadges.length > 0) {
      // Trigger AI generation for up to 10 badges at a time (rate limiting)
      const batchSize = 10
      const batch = templateBadges.slice(0, batchSize)

      for (const badge of batch) {
        try {
          console.log(`[Auto-Repair] Triggering AI generation for badge: ${badge.id}`)
          
          await supabase.functions.invoke('generate-nft-badge-image', {
            body: {
              badge_id: badge.id,
              claim_text: badge.claim_text,
              trust_score: badge.trust_score,
              rarity_tier: badge.rarity_tier
            }
          })

          imagesTriggered++
          
          // Small delay to avoid overwhelming the system
          await new Promise(r => setTimeout(r, 1000))
        } catch (err) {
          console.error(`[Auto-Repair] Image generation failed for badge ${badge.id}:`, err)
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      badges_checked: {
        broken_token_ids: brokenBadges?.length || 0,
        template_images: templateBadges?.length || 0
      },
      repairs: {
        token_ids_fixed: fixed,
        token_ids_failed: failed,
        ai_generation_triggered: imagesTriggered
      },
      message: `Health check complete. Fixed ${fixed} token IDs, triggered ${imagesTriggered} AI generations.`
    }

    console.log('[Auto-Repair] Complete:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('[Auto-Repair] Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
