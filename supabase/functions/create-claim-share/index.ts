import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimShareRequest {
  viralClaimId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { viralClaimId }: ClaimShareRequest = await req.json();

    if (!viralClaimId) {
      return new Response(
        JSON.stringify({ error: 'Missing viralClaimId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get claim details
    const { data: claim, error: claimError } = await supabase
      .from('viral_claims')
      .select('*')
      .eq('id', viralClaimId)
      .single();

    if (claimError || !claim) {
      return new Response(
        JSON.stringify({ error: 'Claim not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch verification data if it exists
    let verification = null;
    if (claim.verification_id) {
      const { data: verificationData } = await supabase
        .from('verifications')
        .select('trust_score, status, result_summary')
        .eq('id', claim.verification_id)
        .single();
      
      verification = verificationData;
    }

    // Check if share already exists
    if (claim.share_token) {
      const origin = req.headers.get('origin') || 'https://veriedit-ai.lovable.app';
      const shareUrl = `${origin}/claim/${claim.share_token}`;
      
      return new Response(
        JSON.stringify({ 
          shareUrl,
          shareToken: claim.share_token,
          ogImageUrl: claim.og_image_url,
          message: 'Using existing share link'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate share token
    const shareToken = crypto.randomUUID();

    // Generate OG image for the claim
    let ogImageUrl = claim.image_url; // Use existing image as fallback
    try {
      const ogImageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-og-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'viral_claim',
          title: claim.claim_text,
          platform: claim.platform,
          engagementScore: claim.engagement_score,
          status: claim.status,
          trustScore: verification?.trust_score, // Include trust score if available
        }),
      });

      if (ogImageResponse.ok) {
        const ogData = await ogImageResponse.json();
        ogImageUrl = ogData.imageUrl || ogImageUrl;
      }
    } catch (ogError) {
      console.error('Error generating OG image:', ogError);
    }

    // Update claim with share token, OG image, and increment share count
    const { error: updateError } = await supabase
      .from('viral_claims')
      .update({
        share_token: shareToken,
        og_image_url: ogImageUrl,
        share_count: (claim.share_count || 0) + 1,
      })
      .eq('id', viralClaimId);

    if (updateError) {
      console.error('Error updating claim:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('origin') || 'https://veriedit-ai.lovable.app';
    const shareUrl = `${origin}/claim/${shareToken}`;

    return new Response(
      JSON.stringify({
        shareUrl,
        shareToken,
        ogImageUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-claim-share:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
