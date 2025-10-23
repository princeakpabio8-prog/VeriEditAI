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

    // Check for legacy template badges and update to Canva templates
    const { data: legacyBadges, error: legacyError } = await supabase
      .from('nft_badges')
      .select('id, metadata_uri, rarity_tier')
      .like('metadata_uri', '%nft-badge-template%')
      .limit(50)

    if (legacyError) {
      console.error('[Auto-Repair] Legacy badge query error:', legacyError)
    }

    console.log(`[Auto-Repair] Found ${legacyBadges?.length || 0} legacy template badges`)

    let legacyUpdated = 0
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''

    // Map rarity to Canva template filename
    const getCanvaTemplate = (rarity: string | null) => {
      const rarityMap: Record<string, string> = {
        'LEGENDARY': 'legendary-truth-badge.jpg',
        'EPIC': 'epic-truth-badge.jpg',
        'RARE': 'rare-truth-badge.jpg',
        'UNCOMMON': 'uncommon-truth-badge.jpg',
        'COMMON': 'common-truth-badge.jpg'
      }
      return rarityMap[rarity || 'COMMON'] || 'common-truth-badge.jpg'
    }

    if (legacyBadges && legacyBadges.length > 0) {
      for (const badge of legacyBadges) {
        try {
          console.log(`[Auto-Repair] Updating legacy badge ${badge.id} to Canva template`)
          
          const fileName = badge.metadata_uri.split('/').pop()
          if (!fileName) continue

          // Download current metadata
          const { data: metadataFile } = await supabase.storage
            .from('nft-metadata')
            .download(fileName)
          
          if (metadataFile) {
            const metadata = JSON.parse(await metadataFile.text())
            const canvaTemplate = getCanvaTemplate(badge.rarity_tier)
            const newImageUrl = `${supabaseUrl}/storage/v1/object/public/nft-badge-images/${canvaTemplate}`
            
            // Update metadata with Canva template
            const updatedMetadata = {
              ...metadata,
              image: newImageUrl
            }
            
            await supabase.storage
              .from('nft-metadata')
              .update(fileName, JSON.stringify(updatedMetadata, null, 2), {
                contentType: 'application/json',
                upsert: true
              })
            
            console.log(`✅ Updated badge ${badge.id} to use ${canvaTemplate}`)
            legacyUpdated++
          }
        } catch (err) {
          console.error(`[Auto-Repair] Failed to update badge ${badge.id}:`, err)
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      badges_checked: {
        broken_token_ids: brokenBadges?.length || 0,
        legacy_template_images: legacyBadges?.length || 0
      },
      repairs: {
        token_ids_fixed: fixed,
        token_ids_failed: failed,
        legacy_badges_updated: legacyUpdated
      },
      message: `Health check complete. Fixed ${fixed} token IDs, updated ${legacyUpdated} legacy badges to Canva templates.`
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
