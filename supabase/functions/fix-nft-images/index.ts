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

    console.log('🔄 Fixing NFT metadata and images...');

    // Get all badges that need fixing
    const { data: badges, error: badgesError } = await supabase
      .from('nft_badges')
      .select('*')
      .order('minted_at', { ascending: false });

    if (badgesError) throw badgesError;

    if (!badges || badges.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No badges found',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updated = 0;
    const results = [];

    for (const badge of badges) {
      try {
        console.log(`📝 Processing badge #${badge.token_id}...`);

        // Extract filename from metadata URI
        const metadataFileName = badge.metadata_uri.split('/').pop();
        if (!metadataFileName) {
          console.log(`⚠️ Invalid metadata URI: ${badge.metadata_uri}`);
          continue;
        }

        // Download existing metadata
        const { data: metadataFile, error: downloadError } = await supabase.storage
          .from('nft-metadata')
          .download(metadataFileName);

        if (downloadError) {
          console.log(`⚠️ Download error: ${downloadError.message}`);
          continue;
        }

        const metadata = JSON.parse(await metadataFile.text());

        // Update with correct image URL
        const imageUrl = `https://sqtkkzdswxazyikcheds.supabase.co/storage/v1/object/public/nft-badge-images/truth-badge-template.png`;
        
        const updatedMetadata = {
          ...metadata,
          image: imageUrl,
          background_color: "0d1117",
        };

        // Re-upload metadata
        const { error: uploadError } = await supabase.storage
          .from('nft-metadata')
          .update(metadataFileName, JSON.stringify(updatedMetadata, null, 2), {
            contentType: 'application/json',
            upsert: true
          });

        if (uploadError) {
          console.log(`⚠️ Upload error: ${uploadError.message}`);
          continue;
        }

        // Refresh OpenSea metadata
        try {
          const cleanTokenId = badge.token_id.replace(/^0+/, '') || '0';
          const refreshUrl = `https://api.opensea.io/api/v2/chain/matic/contract/${contractAddress}/nfts/${cleanTokenId}/refresh`;
          
          const OPENSEA_API_KEY = Deno.env.get('OPENSEA_API_KEY');
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (OPENSEA_API_KEY) headers['X-API-KEY'] = OPENSEA_API_KEY;

          await fetch(refreshUrl, { method: 'POST', headers });
          console.log(`✅ Refreshed OpenSea for token #${cleanTokenId}`);
        } catch (refreshError) {
          console.log(`⚠️ OpenSea refresh failed (non-critical):`, refreshError);
        }

        updated++;
        results.push({
          token_id: badge.token_id,
          status: 'success',
          image_url: imageUrl
        });

      } catch (error: any) {
        console.error(`❌ Error processing badge #${badge.token_id}:`, error.message);
        results.push({
          token_id: badge.token_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log(`✅ Complete: ${updated}/${badges.length} badges fixed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${updated} of ${badges.length} badges`,
        updated,
        total: badges.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Fix metadata error:', error);
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
