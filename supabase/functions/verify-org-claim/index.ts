import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claim_id } = await req.json();

    if (!claim_id) {
      throw new Error('claim_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔬 Verifying claim: ${claim_id}`);

    // Get the claim
    const { data: claim, error: claimError } = await supabase
      .from('organization_claims')
      .select('*, organizations(*)')
      .eq('id', claim_id)
      .single();

    if (claimError || !claim) {
      throw new Error('Claim not found');
    }

    // Call the main verify function
    const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify', {
      body: {
        content: claim.claim_text,
        category: claim.organizations.industry.toLowerCase(),
      },
    });

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      throw verifyError;
    }

    console.log(`📊 Verification result:`, verificationResult);

    const trustScore = verificationResult.confidence || 0;
    
    // Calculate confidence level based on trust score
    let confidenceLevel: string;
    let verificationStatus: string;

    if (trustScore >= 81) {
      confidenceLevel = 'High Confidence';
      verificationStatus = 'verified';
    } else if (trustScore >= 61) {
      confidenceLevel = 'Moderate Confidence';
      verificationStatus = 'verified';
    } else if (trustScore >= 41) {
      confidenceLevel = 'Low Confidence';
      verificationStatus = 'unverified';
    } else {
      confidenceLevel = 'Very Low Confidence';
      verificationStatus = 'refuted';
    }

    // Update the claim with verification results
    const { error: updateError } = await supabase
      .from('organization_claims')
      .update({
        verification_id: verificationResult.id,
        trust_score: trustScore,
        confidence_level: confidenceLevel,
        verification_status: verificationStatus,
      })
      .eq('id', claim_id);

    if (updateError) {
      console.error('❌ Failed to update claim:', updateError);
    }

    // Update organization aggregate stats
    const { data: orgClaims } = await supabase
      .from('organization_claims')
      .select('trust_score')
      .eq('organization_id', claim.organization_id)
      .not('trust_score', 'is', null);

    if (orgClaims && orgClaims.length > 0) {
      const avgTrustScore = orgClaims.reduce((sum, c) => sum + (c.trust_score || 0), 0) / orgClaims.length;
      
      await supabase
        .from('organizations')
        .update({
          avg_trust_score: Math.round(avgTrustScore),
          total_verifications: orgClaims.length,
        })
        .eq('id', claim.organization_id);

      console.log(`✅ Updated organization stats: avg=${Math.round(avgTrustScore)}, total=${orgClaims.length}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        trust_score: trustScore,
        confidence_level: confidenceLevel,
        verification_status: verificationStatus,
        verification_id: verificationResult.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
