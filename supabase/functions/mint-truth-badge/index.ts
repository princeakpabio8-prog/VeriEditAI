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
      throw new Error('Missing required environment variables. Please configure TRUTH_BADGE_CONTRACT_ADDRESS and MINTING_WALLET_PRIVATE_KEY')
    }
    
    // Import ethers dynamically
    const { ethers } = await import('https://esm.sh/ethers@6.9.0')
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/')
    const wallet = new ethers.Wallet(mintingWalletPK, provider)
    
    // TruthBadge contract ABI (only the functions we need)
    const contractABI = [
      'function mintBadge(address to, string memory verificationId, uint256 trustScore, string memory metadataURI) public returns (uint256)',
      'function verificationMinted(string memory verificationId) public view returns (bool)',
      'function totalSupply() public view returns (uint256)'
    ]
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet)
    
    // Check if already minted on-chain
    const alreadyMinted = await contract.verificationMinted(verificationId)
    if (alreadyMinted) {
      throw new Error('Badge already minted on blockchain for this verification')
    }
    
    // Get the badge image URL from Supabase Storage
    const badgeImageUrl = `https://sqtkkzdswxazyikcheds.supabase.co/storage/v1/object/public/nft-badge-images/truth-badge-template.png`
    
    // Upload metadata
    const metadata = {
      name: `VeriEdit Truth Badge #${await contract.totalSupply() + 1n}`,
      description: `This VeriEdit Truth Badge certifies that a claim was verified with ${verification.trust_score}% confidence. VeriEdit uses AI-powered fact-checking to analyze claims against multiple trusted sources, providing transparent verification for truth-seekers worldwide.`,
      image: badgeImageUrl,
      attributes: [
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
      ],
      external_url: `https://veriedit.ai/share/${verificationId}`,
      verification_id: verificationId,
      claim_text: verification.content.substring(0, 500)
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
    
    // Mint NFT on blockchain
    console.log('🔨 Minting badge on Polygon Mainnet...')
    const tx = await contract.mintBadge(
      walletAddress,
      verificationId,
      verification.trust_score,
      metadataURI
    )
    
    console.log('⏳ Waiting for confirmation...')
    const receipt = await tx.wait()
    
    console.log('✅ Badge minted! Transaction:', receipt.hash)
    
    // Extract tokenId from events
    const mintEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'BadgeMinted'
      } catch {
        return false
      }
    })
    
    let tokenId = '0'
    if (mintEvent) {
      const parsed = contract.interface.parseLog(mintEvent)
      tokenId = parsed?.args[0].toString()
    }
    
    // Store in database
    const { error: insertError } = await supabase
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
        wallet_address: walletAddress
      })
    
    if (insertError) throw insertError
    
    return new Response(
      JSON.stringify({
        success: true,
        tokenId,
        transactionHash: receipt.hash,
        metadataUri: metadataURI,
        explorerUrl: `https://polygonscan.com/tx/${receipt.hash}`
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
