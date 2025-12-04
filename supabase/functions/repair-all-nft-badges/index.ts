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
    
    console.log('🔧 Starting comprehensive NFT badge repair process...')
    
    // Step 1: Get all badges from the database
    const { data: badges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('id, metadata_uri, rarity_tier, token_id, contract_address')
      .order('minted_at', { ascending: false })
    
    if (fetchError) throw fetchError
    
    console.log(`📊 Found ${badges?.length || 0} badges to process`)
    
    const results = {
      total: badges?.length || 0,
      metadataFixed: 0,
      metadataFailed: 0,
      openSeaRefreshed: 0,
      openSeaFailed: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    // Step 2: Process each badge
    for (const badge of badges || []) {
      try {
        const rarityTier = badge.rarity_tier || 'COMMON'
        const badgeFileName = `${rarityTier.toLowerCase()}-truth-badge.jpg`
        const correctImageUrl = `${supabaseUrl}/storage/v1/object/public/nft-badge-images/${badgeFileName}`
        
        // Fetch current metadata
        if (!badge.metadata_uri) {
          console.log(`⏭️ Skipping badge ${badge.id} - no metadata_uri`)
          results.skipped++
          continue
        }
        
        let currentMetadata = null
        try {
          const metadataResponse = await fetch(badge.metadata_uri)
          if (metadataResponse.ok) {
            currentMetadata = await metadataResponse.json()
          }
        } catch (e) {
          console.log(`⚠️ Could not fetch metadata for ${badge.id}`)
        }
        
        // Check if metadata needs fixing
        const needsFix = !currentMetadata || 
          !currentMetadata.image || 
          currentMetadata.image.includes('template') ||
          currentMetadata.image.includes('white') ||
          !currentMetadata.image.includes('nft-badge-images')
        
        if (needsFix || currentMetadata) {
          // Extract filename from metadata_uri
          const metadataFileName = badge.metadata_uri.split('/').pop()
          
          if (metadataFileName) {
            // Create updated metadata
            const updatedMetadata = currentMetadata || {
              name: `VeriEdit Truth Badge`,
              description: 'VeriEdit Truth Badge - Verified claim on the blockchain',
              attributes: []
            }
            
            // Update image URL to correct badge
            updatedMetadata.image = correctImageUrl
            
            // Re-upload metadata
            const { error: uploadError } = await supabase.storage
              .from('nft-metadata')
              .upload(metadataFileName, JSON.stringify(updatedMetadata, null, 2), {
                contentType: 'application/json',
                upsert: true
              })
            
            if (uploadError) {
              console.error(`❌ Failed to update metadata for ${badge.id}:`, uploadError)
              results.metadataFailed++
              results.errors.push(`Badge ${badge.id}: ${uploadError.message}`)
            } else {
              console.log(`✅ Fixed metadata for badge ${badge.id} -> ${rarityTier}`)
              results.metadataFixed++
            }
          }
        } else {
          console.log(`✓ Badge ${badge.id} metadata already correct`)
          results.skipped++
        }
        
        // Step 3: Trigger OpenSea refresh for each badge
        if (badge.token_id && badge.contract_address) {
          try {
            const cleanTokenId = badge.token_id.replace(/^0+/, '') || '0'
            const openSeaRefreshUrl = `https://api.opensea.io/api/v2/chain/matic/contract/${badge.contract_address}/nfts/${cleanTokenId}/refresh`
            
            const refreshResponse = await fetch(openSeaRefreshUrl, {
              method: 'POST',
              headers: {
                'Accept': 'application/json'
              }
            })
            
            if (refreshResponse.ok || refreshResponse.status === 202) {
              console.log(`🔄 OpenSea refresh triggered for token ${cleanTokenId}`)
              results.openSeaRefreshed++
            } else {
              console.log(`⚠️ OpenSea refresh status for ${cleanTokenId}: ${refreshResponse.status}`)
              results.openSeaFailed++
            }
          } catch (e) {
            console.log(`⚠️ OpenSea refresh failed for badge ${badge.id}`)
            results.openSeaFailed++
          }
          
          // Rate limit: small delay between OpenSea requests
          await new Promise(r => setTimeout(r, 200))
        }
        
      } catch (err: any) {
        console.error(`❌ Error processing badge ${badge.id}:`, err)
        results.errors.push(`Badge ${badge.id}: ${err.message}`)
      }
    }
    
    console.log('✅ Repair process complete:', results)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Repaired ${results.metadataFixed} badges, refreshed ${results.openSeaRefreshed} on OpenSea`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('❌ Repair process error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
