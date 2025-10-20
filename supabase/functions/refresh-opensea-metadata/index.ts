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

    if (!contractAddress) {
      throw new Error('TRUTH_BADGE_CONTRACT_ADDRESS not configured');
    }

    if (!token_id) {
      throw new Error('token_id is required');
    }

    // Clean token ID (remove leading zeros)
    const cleanTokenId = token_id.toString().replace(/^0+/, '') || '0';

    console.log(`🔄 Refreshing OpenSea metadata for token #${cleanTokenId}`);

    // OpenSea metadata refresh endpoint (forces OpenSea to re-fetch metadata from your contract)
    const refreshUrl = `https://api.opensea.io/api/v2/chain/matic/contract/${contractAddress}/nfts/${cleanTokenId}/refresh`;
    
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

    console.log('✅ OpenSea metadata refresh requested successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Metadata refresh queued on OpenSea',
        tokenId: cleanTokenId,
        openSeaUrl: `https://opensea.io/assets/matic/${contractAddress}/${cleanTokenId}`,
        note: 'Changes may take a few minutes to appear on OpenSea'
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
