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

    // Ensure template image exists in storage
    try {
      const { data: tpl, error: tplErr } = await supabase.storage
        .from('nft-badge-images')
        .download('truth-badge-template.png');
      if (tplErr) throw tplErr;
      console.log('🖼️ Template image already present in storage.');
    } catch (_e) {
      console.log('⬆️ Uploading template image to storage...');
      const templateUrl = 'https://0c43cf4d-e9e1-4158-ae12-b606b1393a45.lovableproject.com/nft-badge-template.png';
      const resp = await fetch(templateUrl);
      if (!resp.ok) throw new Error(`Failed to fetch template image: ${resp.status}`);
      const arrayBuf = await resp.arrayBuffer();
      const { error: uploadTplError } = await supabase.storage
        .from('nft-badge-images')
        .upload('truth-badge-template.png', arrayBuf, { contentType: 'image/png', upsert: true });
      if (uploadTplError) throw uploadTplError;
      console.log('✅ Template image uploaded to storage.');
    }

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

        // Refresh OpenSea metadata with correct token ID
        try {
          // Skip if token_id is 0 (needs fixing first)
          if (badge.token_id === '0' || badge.token_id === 0) {
            console.log(`⚠️ Skipping OpenSea refresh for token_id 0 - run fix-token-ids first`);
          } else {
            const cleanTokenId = String(badge.token_id).replace(/^0+/, '') || '0';
            const refreshUrl = `https://api.opensea.io/api/v2/chain/matic/contract/${contractAddress}/nfts/${cleanTokenId}/refresh`;
            
            const OPENSEA_API_KEY = Deno.env.get('OPENSEA_API_KEY');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (OPENSEA_API_KEY) headers['X-API-KEY'] = OPENSEA_API_KEY;

            const refreshResponse = await fetch(refreshUrl, { method: 'POST', headers });
            console.log(`✅ Refreshed OpenSea for token #${cleanTokenId} (status: ${refreshResponse.status})`);
          }
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
