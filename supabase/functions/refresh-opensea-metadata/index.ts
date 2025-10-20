import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token_id } = await req.json();
    const contractAddress = Deno.env.get('TRUTH_BADGE_CONTRACT_ADDRESS');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!contractAddress) {
      throw new Error('TRUTH_BADGE_CONTRACT_ADDRESS not configured');
    }

    if (!token_id) {
      throw new Error('token_id is required');
    }

    // Clean token ID (remove leading zeros)
    const cleanTokenId = token_id.toString().replace(/^0+/, '') || '0';

    console.log(`🔄 Refreshing OpenSea metadata for token #${cleanTokenId}`);

    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get badge data to verify metadata
    const { data: badgeData, error: badgeError } = await supabase
      .from('nft_badges')
      .select('metadata_uri, id')
      .eq('token_id', cleanTokenId)
      .single();

    if (badgeError || !badgeData) {
      console.warn('⚠️ Badge not found in database, proceeding with refresh anyway');
    } else {
      // Verify metadata is accessible
      console.log(`📦 Verifying metadata: ${badgeData.metadata_uri}`);
      const metadataCheck = await fetch(badgeData.metadata_uri);
      
      if (!metadataCheck.ok) {
        throw new Error('Metadata not yet available - cannot refresh OpenSea');
      }
      
      const metadata = await metadataCheck.json();
      console.log(`✅ Metadata verified with image: ${metadata.image}`);
      
      // Verify image is accessible (non-blocking)
      try {
        const imageCheck = await fetch(metadata.image, { method: 'HEAD' });
        if (!imageCheck.ok) {
          console.warn('⚠️ Image not accessible yet, but proceeding with refresh');
        } else {
          console.log('✅ Image accessible');
        }
      } catch (imgErr) {
        console.warn('⚠️ Image check failed, but proceeding with refresh');
      }
    }

    // OpenSea metadata refresh endpoint (forces OpenSea to re-fetch metadata from your contract)
    const refreshUrl = `https://api.opensea.io/api/v2/chain/polygon/contract/${contractAddress}/nfts/${cleanTokenId}/refresh`;
    
    const OPENSEA_API_KEY = Deno.env.get('OPENSEA_API_KEY');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (OPENSEA_API_KEY) {
      headers['X-API-KEY'] = OPENSEA_API_KEY;
    }

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenSea API error (${response.status}):`, errorText);
      
      // Non-fatal error - OpenSea refresh is optional
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'OpenSea refresh request failed but NFT is still valid',
          error: errorText,
          note: 'Metadata will refresh automatically within 24 hours'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await response.json();
    console.log('✅ OpenSea refresh response:', responseData);

    // Update database with refresh status (if badge exists)
    if (badgeData) {
      await supabase
        .from('nft_badges')
        .update({ 
          opensea_last_refresh: new Date().toISOString(),
          opensea_refresh_count: badgeData.opensea_refresh_count ? badgeData.opensea_refresh_count + 1 : 1
        })
        .eq('id', badgeData.id);
      
      console.log('📊 Updated refresh count in database');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Metadata refresh queued on OpenSea',
        tokenId: cleanTokenId,
        openSeaUrl: `https://opensea.io/assets/polygon/${contractAddress}/${cleanTokenId}`,
        note: 'Changes may take a few minutes to appear on OpenSea',
        response: responseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Refresh error:', error);
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
