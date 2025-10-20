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
    const supabase = createClient(supabaseUrl, supabaseKey);
    const contractAddress = Deno.env.get('TRUTH_BADGE_CONTRACT_ADDRESS');

    if (!contractAddress) {
      throw new Error('TRUTH_BADGE_CONTRACT_ADDRESS not configured');
    }

    console.log('🔄 Syncing OpenSea collection data...');

    // Get all NFT badges
    const { data: badges, error: badgesError } = await supabase
      .from('nft_badges')
      .select('id, token_id, wallet_address, opensea_url, opensea_listed')
      .order('minted_at', { ascending: false });

    if (badgesError) throw badgesError;

    if (!badges || badges.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No badges to sync',
          stats: { total: 0, updated: 0, listed: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updated = 0;
    let listed = 0;

    for (const badge of badges) {
      // Ensure token_id is properly formatted (no leading zeros unless needed)
      const cleanTokenId = badge.token_id.replace(/^0+/, '') || '0';
      
      // Generate OpenSea URLs
      const openSeaUrl = `https://opensea.io/assets/matic/${contractAddress}/${cleanTokenId}`;
      const openseaMetadataUrl = `https://api.opensea.io/api/v2/chain/matic/contract/${contractAddress}/nfts/${cleanTokenId}`;
      
      console.log(`🔗 Syncing badge #${cleanTokenId}: ${openSeaUrl}`);
      
      // Update badge with OpenSea URL and proper token ID
      const { error: updateError } = await supabase
        .from('nft_badges')
        .update({
          token_id: cleanTokenId,  // Ensure clean token ID
          opensea_url: openSeaUrl,
          opensea_listed: true
        })
        .eq('id', badge.id);

      if (!updateError) {
        updated++;
        if (!badge.opensea_listed) {
          listed++;
        }
      } else {
        console.error(`Failed to update badge ${badge.id}:`, updateError);
      }
    }

    // Update collection stats
    const { error: statsError } = await supabase
      .from('nft_collection_stats')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        owners_count: new Set(badges.map(b => b.wallet_address)).size,
        listed_count: listed,
        last_synced_at: new Date().toISOString()
      });

    if (statsError) {
      console.error('Stats update error:', statsError);
    }

    console.log(`✅ Sync complete: ${updated} badges updated, ${listed} newly listed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        stats: {
          total: badges.length,
          updated,
          listed,
          uniqueOwners: new Set(badges.map(b => b.wallet_address)).size
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
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
