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
    const { verificationId, walletAddress } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }
    
    const { data: verification, error: verifyError } = await supabase
      .from('verifications')
      .select('id, content, trust_score, created_at, user_id')
      .eq('id', verificationId)
      .eq('user_id', user.id)
      .single()
    
    if (verifyError || !verification) {
      throw new Error('Verification not found')
    }
    
    if (verification.trust_score < 75) {
      throw new Error('Trust score must be >= 75% to mint badge')
    }
    
    const { data: existingBadge } = await supabase
      .from('nft_badges')
      .select('id')
      .eq('verification_id', verificationId)
      .maybeSingle()
    
    if (existingBadge) {
      throw new Error('Badge already minted for this verification')
    }
    
    // Get environment variables for contract interaction
    const contractAddress = Deno.env.get('TRUTH_BADGE_CONTRACT_ADDRESS')
    const mintingWalletPK = Deno.env.get('MINTING_WALLET_PRIVATE_KEY')
    
    if (!contractAddress || !mintingWalletPK) {
      console.error('❌ Missing environment variables:', {
        hasContractAddress: !!contractAddress,
        hasWalletPK: !!mintingWalletPK
      })
      throw new Error('NFT minting is not configured. Please set up TRUTH_BADGE_CONTRACT_ADDRESS and MINTING_WALLET_PRIVATE_KEY in your Supabase secrets.')
    }
    
    console.log('✅ Environment variables validated:', {
      contractAddress,
      walletPKLength: mintingWalletPK.length
    })
    
    // Import ethers dynamically
    const { ethers } = await import('https://esm.sh/ethers@6.9.0')
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/')
    const wallet = new ethers.Wallet(mintingWalletPK, provider)
    
    // TruthBadge contract ABI (only the functions we need)
    const contractABI = [
      'function mintBadge(address to, string memory verificationId, uint256 trustScore, string memory metadataURI) public returns (uint256)',
      'function verificationMinted(string memory verificationId) public view returns (bool)',
      'function isMinted(string memory verificationId) public view returns (bool)',
      'function totalSupply() public view returns (uint256)',
      'function verificationToToken(string memory verificationId) public view returns (uint256)',
      'function getTokenId(string memory verificationId) public view returns (uint256)',
      'event BadgeMinted(uint256 indexed tokenId, address indexed to, string verificationId)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ]
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet)
    
    // Check supply cap (3,000 maximum NFTs)
    const currentSupply = await contract.totalSupply()
    console.log('📊 Current supply:', currentSupply.toString())
    if (currentSupply >= 3000n) {
      throw new Error('Maximum supply of 3,000 NFTs has been reached')
    }
    
    // Check if already minted on-chain
    const alreadyMinted = await contract.verificationMinted(verificationId)
    if (alreadyMinted) {
      throw new Error('Badge already minted on blockchain for this verification')
    }
    
    // Check if verification is linked to a viral claim and get rarity data
    const { data: viralClaim } = await supabase
      .from('viral_claims')
      .select('id, rarity_tier, virality_score, engagement_score, engagement_velocity, first_seen_at')
      .eq('claim_text', verification.content.substring(0, 500))
      .maybeSingle()
    
    // Check verification race to see if this is first/second/third verifier
    let verifierRank = null
    let rarityTier = viralClaim?.rarity_tier || 'COMMON'
    let viralityScore = viralClaim?.virality_score || 0
    
    if (viralClaim) {
      const { data: race } = await supabase
        .from('verification_races')
        .select('first_verifier_id, second_verifier_id, third_verifier_id')
        .eq('viral_claim_id', viralClaim.id)
        .maybeSingle()
      
      if (race) {
        if (race.first_verifier_id === user.id) {
          verifierRank = 1
          // First verifier gets 2x rarity boost
          if (rarityTier === 'UNCOMMON') rarityTier = 'RARE'
          else if (rarityTier === 'RARE') rarityTier = 'EPIC'
          else if (rarityTier === 'EPIC') rarityTier = 'LEGENDARY'
        } else if (race.second_verifier_id === user.id) {
          verifierRank = 2
        } else if (race.third_verifier_id === user.id) {
          verifierRank = 3
        }
      }
    }
    
    // Use a hosted fallback image - will be replaced with AI-generated image shortly after minting
    // Using a reliable CDN URL that will always be accessible
    const badgeImageUrl = 'https://0c43cf4d-e9e1-4158-ae12-b606b1393a45.lovableproject.com/nft-badge-fallback.png'
    
    // Upload metadata with rarity info
    const attributes = [
      {
        trait_type: 'Rarity',
        value: rarityTier
      },
      {
        trait_type: 'Trust Score',
        value: verification.trust_score,
        display_type: 'number'
      },
      {
        trait_type: 'Verification Date',
        value: verification.created_at
      },
      {
        trait_type: 'Claim Preview',
        value: verification.content.substring(0, 200)
      },
      {
        trait_type: 'Verified By',
        value: 'VeriEdit AI'
      },
      {
        trait_type: 'Chain',
        value: 'Polygon Mainnet'
      }
    ]
    
    if (viralClaim) {
      attributes.push(
        {
          trait_type: 'Virality Score',
          value: Math.round(viralityScore),
          display_type: 'number'
        },
        {
          trait_type: 'Engagement',
          value: viralClaim.engagement_score,
          display_type: 'number'
        }
      )
    }
    
    if (verifierRank) {
      attributes.push({
        trait_type: 'Verifier Rank',
        value: `#${verifierRank}`,
      })
      
      if (verifierRank === 1) {
        attributes.push({
          trait_type: 'First Verifier',
          value: 'Yes'
        })
      }
    }
    
    const metadata = {
      name: `VeriEdit Truth Badge #${await contract.totalSupply() + 1n}`,
      description: `Own a piece of the truth revolution. This ${rarityTier} VeriEdit Truth Badge represents a verified claim in the fight against misinformation. Powered by AI and validated against trusted sources, each badge is a digital artifact proving that facts matter. With a ${verification.trust_score}% confidence rating, this NFT certifies authenticity in an age of deception. Join the movement. Collect truth. Change the world.`,
      image: badgeImageUrl,
      attributes,
      external_url: `https://veriedit.ai/share/${verificationId}`,
      verification_id: verificationId,
      claim_text: verification.content.substring(0, 500),
      rarity_tier: rarityTier
    }
    
    // Upload metadata to Supabase Storage instead of NFT.Storage
    const metadataJson = JSON.stringify(metadata, null, 2)
    const fileName = `badge-${verificationId}-${Date.now()}.json`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-metadata')
      .upload(fileName, metadataJson, {
        contentType: 'application/json'
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload metadata: ${uploadError.message}`)
    }
    
    // Get public URL for the metadata
    const { data: publicUrl } = supabase.storage
      .from('nft-metadata')
      .getPublicUrl(fileName)
    
    const metadataURI = publicUrl.publicUrl
    
    console.log('📦 Metadata uploaded to Supabase Storage:', metadataURI)
    
    // Mint NFT on blockchain with retry logic
    console.log('🔨 Minting badge on Polygon Mainnet...')
    let tx
    let receipt
    let retries = 3
    
    while (retries > 0) {
      try {
        tx = await contract.mintBadge(
          walletAddress,
          verificationId,
          verification.trust_score,
          metadataURI
        )
        
        console.log('⏳ Waiting for confirmation...')
        receipt = await tx.wait()
        console.log('✅ Badge minted! Transaction:', receipt.hash)
        break
      } catch (mintError: any) {
        retries--
        console.error(`❌ Mint attempt failed (${3 - retries}/3):`, mintError.message)
        
        if (retries === 0) {
          throw new Error(`Blockchain minting failed after 3 attempts: ${mintError.message}`)
        }
        
        // Wait before retry
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    
    // Resolve tokenId reliably with multiple strategies
    let tokenId = '0'

    try {
      // 1) Prefer explicit getter if available
      try {
        const viaGetter = await (contract as any).getTokenId?.(verificationId)
        if (viaGetter) {
          tokenId = viaGetter.toString()
          console.log('✅ Token ID from getTokenId:', tokenId)
        }
      } catch (e) {
        console.log('ℹ️ getTokenId not available or failed, will try other methods')
      }

      // 2) Public mapping getter
      if (tokenId === '0') {
        const mapped = await contract.verificationToToken(verificationId)
        tokenId = mapped.toString()
        console.log('✅ Token ID from verificationToToken:', tokenId)
      }

      // 3) Parse emitted events (BadgeMinted or ERC721 Transfer)
      if (tokenId === '0') {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data })
            if (parsed?.name === 'BadgeMinted' || parsed?.name === 'Transfer') {
              const parsedTokenId =
                parsed.args?.tokenId?.toString() ||
                parsed.args?.[2]?.toString() ||
                parsed.args?.[0]?.toString()
              if (parsedTokenId) {
                tokenId = parsedTokenId
                console.log(`🔢 Token ID from ${parsed.name} event:`, tokenId)
                break
              }
            }
          } catch (_) {/* ignore parse errors */}
        }
      }

      // 4) Brief delay and retry mapping (in case of propagation delays)
      if (tokenId === '0') {
        await new Promise((r) => setTimeout(r, 1500))
        try {
          const viaGetter2 = await (contract as any).getTokenId?.(verificationId)
          if (viaGetter2) tokenId = viaGetter2.toString()
        } catch (_) {}
        if (tokenId === '0') {
          try {
            const mapped2 = await contract.verificationToToken(verificationId)
            tokenId = mapped2.toString()
          } catch (_) {}
        }
        if (tokenId !== '0') console.log('🔁 Token ID after retry:', tokenId)
      }

      // 5) Final fallback: use totalSupply (best-effort)
      if (tokenId === '0') {
        const totalSupply = await contract.totalSupply()
        tokenId = totalSupply.toString()
        console.log('⚠️ Using totalSupply as fallback:', tokenId)
      }
    } catch (tokenErr) {
      console.error('❌ Token ID resolution failed:', tokenErr)
      // keep tokenId as '0' if everything failed
    }
    
    // Store in database with rarity and viral data
    const { data: badgeData, error: insertError } = await supabase
      .from('nft_badges')
      .insert({
        user_id: user.id,
        verification_id: verificationId,
        token_id: tokenId,
        contract_address: contractAddress,
        transaction_hash: receipt.hash,
        chain_id: 137,
        metadata_uri: metadataURI,
        claim_text: verification.content.substring(0, 500),
        trust_score: verification.trust_score,
        wallet_address: walletAddress,
        rarity_tier: rarityTier,
        viral_claim_id: viralClaim?.id,
        virality_score: viralityScore,
        minted_at_rank: verifierRank,
        opensea_url: `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    // CRITICAL: If token_id is still 0, schedule immediate background fix
    if (tokenId === '0') {
      console.log('⚠️ Token ID is 0, triggering immediate background correction...')
      EdgeRuntime.waitUntil(
        (async () => {
          // Wait 3 seconds for blockchain state to settle
          await new Promise(r => setTimeout(r, 3000))
          
          try {
            const { error: fixError } = await supabase.functions.invoke('fix-token-ids')
            if (fixError) {
              console.error('❌ Background token ID fix failed:', fixError)
            } else {
              console.log('✅ Background token ID fix completed successfully')
              
              // After fixing token IDs, fix images and sync OpenSea
              await supabase.functions.invoke('fix-nft-badge-images')
              await supabase.functions.invoke('sync-opensea-collection')
              console.log('✅ Full sync completed')
            }
          } catch (err) {
            console.error('❌ Background sync failed:', err)
          }
        })()
      )
    }
    
    // Calculate listing price based on rarity tier and trust score
    // Base prices in MATIC by rarity tier
    const rarityPrices = {
      'LEGENDARY': 100,   // 100 MATIC base
      'EPIC': 50,         // 50 MATIC base
      'RARE': 25,         // 25 MATIC base
      'UNCOMMON': 10,     // 10 MATIC base
      'COMMON': 5         // 5 MATIC base
    }
    
    // Get base price from rarity tier
    const basePrice = rarityPrices[rarityTier as keyof typeof rarityPrices] || rarityPrices.COMMON
    
    // Apply trust score multiplier (75-100 range becomes 0.75-1.0 multiplier)
    const trustMultiplier = verification.trust_score / 100
    
    // Apply virality bonus (up to 50% bonus for high virality)
    const viralityBonus = viralityScore > 0 ? 1 + (Math.min(viralityScore, 100) / 200) : 1
    
    // First verifier bonus (2x multiplier)
    const verifierBonus = verifierRank === 1 ? 2 : 1
    
    // Final listing price
    const listingPrice = basePrice * trustMultiplier * viralityBonus * verifierBonus
    
    // Auto-create marketplace listing
    const { error: listingError } = await supabase
      .from('nft_marketplace_listings')
      .insert({
        badge_id: badgeData.id,
        token_id: tokenId,
        seller_address: walletAddress,
        listing_price: listingPrice,
        currency: 'MATIC',
        platform: 'opensea',
        is_active: true,
        listing_url: `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`
      })
    
    if (listingError) {
      console.error('Failed to create marketplace listing:', listingError)
      // Don't throw - listing is optional, minting succeeded
    } else {
      console.log(`💰 Auto-listed NFT for ${listingPrice.toFixed(2)} MATIC`)
    }
    
    // Background tasks: AI image generation + OpenSea refresh (non-blocking, with error recovery)
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Wait for initial blockchain propagation
          await new Promise(r => setTimeout(r, 2000))
          
          // 1. Generate AI badge image with retry
          console.log('🎨 Triggering AI badge image generation...')
          let imageGenerated = false
          for (let i = 0; i < 2; i++) {
            try {
              const { error: imgError } = await supabase.functions.invoke('generate-nft-badge-image', {
                body: {
                  badge_id: badgeData.id,
                  claim_text: verification.content,
                  trust_score: verification.trust_score,
                  rarity_tier: rarityTier
                }
              })
              if (!imgError) {
                console.log('✅ AI badge image generated')
                imageGenerated = true
                break
              } else {
                console.error(`Image generation attempt ${i + 1} failed:`, imgError)
              }
            } catch (imgErr) {
              console.error(`Image generation attempt ${i + 1} error:`, imgErr)
            }
            if (i < 1) await new Promise(r => setTimeout(r, 1000))
          }

          // 2. Wait for metadata to be available
          await new Promise(r => setTimeout(r, 3000))

          // 3. Refresh OpenSea metadata with retry
          console.log('🔄 Refreshing OpenSea metadata...')
          let openseaRefreshed = false
          for (let i = 0; i < 2; i++) {
            try {
              const { error: refreshError } = await supabase.functions.invoke('refresh-opensea-metadata', {
                body: { token_id: tokenId }
              })
              if (!refreshError) {
                console.log('✅ OpenSea metadata refreshed')
                openseaRefreshed = true
                break
              } else {
                console.error(`OpenSea refresh attempt ${i + 1} failed:`, refreshError)
              }
            } catch (refreshErr) {
              console.error(`OpenSea refresh attempt ${i + 1} error:`, refreshErr)
            }
            if (i < 1) await new Promise(r => setTimeout(r, 2000))
          }

          // 4. Update marketplace listing status if successful
          if (openseaRefreshed) {
            await supabase
              .from('nft_badges')
              .update({ opensea_listed: true })
              .eq('id', badgeData.id)
            console.log('✅ Marketplace status updated')
          }
          
          console.log('✅ All background tasks completed', {
            imageGenerated,
            openseaRefreshed
          })
        } catch (bgError) {
          console.error('❌ Background task error:', bgError)
          // Don't throw - these are optional enhancements
        }
      })()
    )
    
    return new Response(
      JSON.stringify({
        success: true,
        tokenId,
        transactionHash: receipt.hash,
        metadataUri: metadataURI,
        explorerUrl: `https://polygonscan.com/tx/${receipt.hash}`,
        listing: {
          price: listingPrice.toFixed(2),
          currency: 'MATIC',
          url: `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('Minting error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
