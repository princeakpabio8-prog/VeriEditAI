import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const contractAddress = Deno.env.get('TRUTH_BADGE_CONTRACT_ADDRESS');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!contractAddress) {
      throw new Error('TRUTH_BADGE_CONTRACT_ADDRESS not configured');
    }

    console.log('🔧 Starting token ID correction...');

    // Import ethers
    const { ethers } = await import('https://esm.sh/ethers@6.9.0');
    
    // Setup provider (read-only, no wallet needed)
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    
    // Contract ABI for reading
    const contractABI = [
      'function verificationToToken(string memory verificationId) public view returns (uint256)',
      'function verificationMinted(string memory verificationId) public view returns (bool)'
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Get all badges with verification_id
    const { data: badges, error: badgesError } = await supabase
      .from('nft_badges')
      .select('id, verification_id, token_id')
      .order('minted_at', { ascending: true });

    if (badgesError) throw badgesError;

    if (!badges || badges.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No badges found to fix',
          fixed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${badges.length} badges to check`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    const results = [];

    for (const badge of badges) {
      try {
        console.log(`\n🔍 Checking badge ${badge.id} (current token_id: ${badge.token_id})...`);

        // Check if this verification was actually minted on-chain
        const isMinted = await contract.verificationMinted(badge.verification_id);
        
        if (!isMinted) {
          console.log(`⚠️ Badge ${badge.id} not found on-chain, skipping`);
          skipped++;
          results.push({
            badge_id: badge.id,
            verification_id: badge.verification_id,
            status: 'skipped',
            reason: 'not_minted_on_chain'
          });
          continue;
        }

        // Get the correct token ID from the contract
        const correctTokenId = await contract.verificationToToken(badge.verification_id);
        const correctTokenIdStr = correctTokenId.toString();
        
        console.log(`📝 Correct token ID from contract: ${correctTokenIdStr}`);

        // Update if different
        if (badge.token_id !== correctTokenIdStr) {
          const { error: updateError } = await supabase
            .from('nft_badges')
            .update({ token_id: correctTokenIdStr })
            .eq('id', badge.id);

          if (updateError) {
            console.error(`❌ Failed to update badge ${badge.id}:`, updateError);
            errors++;
            results.push({
              badge_id: badge.id,
              verification_id: badge.verification_id,
              old_token_id: badge.token_id,
              correct_token_id: correctTokenIdStr,
              status: 'error',
              error: updateError.message
            });
          } else {
            console.log(`✅ Updated badge ${badge.id}: ${badge.token_id} → ${correctTokenIdStr}`);
            fixed++;
            results.push({
              badge_id: badge.id,
              verification_id: badge.verification_id,
              old_token_id: badge.token_id,
              correct_token_id: correctTokenIdStr,
              status: 'fixed'
            });
          }
        } else {
          console.log(`✓ Badge ${badge.id} already has correct token ID`);
          skipped++;
          results.push({
            badge_id: badge.id,
            verification_id: badge.verification_id,
            token_id: badge.token_id,
            status: 'already_correct'
          });
        }

      } catch (error: any) {
        console.error(`❌ Error processing badge ${badge.id}:`, error.message);
        errors++;
        results.push({
          badge_id: badge.id,
          verification_id: badge.verification_id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`\n✅ Token ID correction complete!`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${fixed} of ${badges.length} badges`,
        stats: {
          total: badges.length,
          fixed,
          skipped,
          errors
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Token ID fix error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
