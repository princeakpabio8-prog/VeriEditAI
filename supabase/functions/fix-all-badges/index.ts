import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.9.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const contractAddress = Deno.env.get('TRUTH_BADGE_CONTRACT_ADDRESS')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting comprehensive badge repair...');

    // Setup blockchain connection
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    const contractABI = [
      'function verificationToToken(string memory verificationId) public view returns (uint256)',
      'function getTokenId(string memory verificationId) public view returns (uint256)',
    ];
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Get all badges with token_id = 0 or null
    const { data: brokenBadges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('*')
      .or('token_id.eq.0,token_id.is.null');

    if (fetchError) {
      console.error('❌ Error fetching broken badges:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${brokenBadges?.length || 0} badges to fix`);

    let fixedCount = 0;
    const results = [];

    for (const badge of brokenBadges || []) {
      try {
        console.log(`\n🔍 Processing badge ${badge.id} (verification: ${badge.verification_id})`);

        let tokenId = '0';

        // Try multiple strategies to get token ID
        try {
          const viaGetter = await (contract as any).getTokenId?.(badge.verification_id);
          if (viaGetter && viaGetter.toString() !== '0') {
            tokenId = viaGetter.toString();
            console.log(`✅ Got token ID from getTokenId: ${tokenId}`);
          }
        } catch (e) {
          console.log('ℹ️ getTokenId not available, trying verificationToToken');
        }

        if (tokenId === '0') {
          const mapped = await contract.verificationToToken(badge.verification_id);
          tokenId = mapped.toString();
          console.log(`✅ Got token ID from verificationToToken: ${tokenId}`);
        }

        if (tokenId !== '0') {
          // Update badge with correct token ID
          const { error: updateError } = await supabase
            .from('nft_badges')
            .update({
              token_id: tokenId,
              opensea_url: `https://opensea.io/assets/polygon/${contractAddress}/${tokenId}`
            })
            .eq('id', badge.id);

          if (updateError) {
            console.error(`❌ Error updating badge ${badge.id}:`, updateError);
            results.push({ badge_id: badge.id, success: false, error: updateError.message });
          } else {
            console.log(`✅ Fixed badge ${badge.id} with token ID ${tokenId}`);
            fixedCount++;
            
            // Trigger OpenSea metadata refresh
            try {
              const refreshResponse = await fetch(`https://api.opensea.io/api/v2/chain/polygon/contract/${contractAddress}/nfts/${tokenId}/refresh`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                }
              });
              
              if (refreshResponse.ok) {
                console.log(`✅ OpenSea metadata refreshed for token ${tokenId}`);
              } else {
                console.warn(`⚠️ OpenSea refresh failed for token ${tokenId}: ${refreshResponse.status}`);
              }
            } catch (refreshErr) {
              console.warn(`⚠️ OpenSea refresh error for token ${tokenId}:`, refreshErr);
            }

            results.push({ 
              badge_id: badge.id, 
              success: true, 
              token_id: tokenId,
              opensea_url: `https://opensea.io/assets/polygon/${contractAddress}/${tokenId}`
            });
          }
        } else {
          console.warn(`⚠️ Could not resolve token ID for badge ${badge.id}`);
          results.push({ badge_id: badge.id, success: false, error: 'Token ID still 0 after all attempts' });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));

      } catch (err: any) {
        console.error(`❌ Error processing badge ${badge.id}:`, err.message);
        results.push({ badge_id: badge.id, success: false, error: err.message });
      }
    }

    console.log(`\n✅ Badge repair complete! Fixed ${fixedCount}/${brokenBadges?.length || 0} badges`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${fixedCount} badges`,
        total_checked: brokenBadges?.length || 0,
        total_fixed: fixedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
