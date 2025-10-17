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
    
    // For testnet demo, create a simulated badge record
    // In production, this would mint actual NFT via ethers.js and NFTs2Me/custom contract
    const mockTokenId = Math.floor(Math.random() * 1000000).toString()
    const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    
    const { error: insertError } = await supabase
      .from('nft_badges')
      .insert({
        user_id: user.id,
        verification_id: verificationId,
        token_id: mockTokenId,
        contract_address: '0x0000000000000000000000000000000000000000',
        transaction_hash: mockTxHash,
        chain_id: 8081,
        metadata_uri: `ipfs://demo-${verification.id}`,
        claim_text: verification.content.substring(0, 500),
        trust_score: verification.trust_score,
        wallet_address: walletAddress
      })
    
    if (insertError) throw insertError
    
    return new Response(
      JSON.stringify({
        success: true,
        tokenId: mockTokenId,
        transactionHash: mockTxHash,
        metadataUri: `ipfs://demo-${verification.id}`,
        explorerUrl: `https://explorer-liberty10.shardeum.org/tx/${mockTxHash}`
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
