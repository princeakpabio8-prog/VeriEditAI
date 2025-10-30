import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const {
      claim_id,
      verification_id,
      verified_claim,
      summary,
    } = await req.json();

    console.log('Submitting bounty completion:', { claim_id, verification_id });

    // Get claim details
    const { data: claim, error: claimError } = await supabaseClient
      .from('bounty_claims')
      .select('*, truth_bounties(*)')
      .eq('id', claim_id)
      .eq('verifier_id', user.id)
      .single();

    if (claimError) throw claimError;

    // Get verification details
    const { data: verification, error: verificationError } = await supabaseClient
      .from('verifications')
      .select('*')
      .eq('id', verification_id)
      .single();

    if (verificationError) throw verificationError;

    // Create completion
    const { data: completion, error: completionError } = await supabaseClient
      .from('bounty_completions')
      .insert({
        bounty_id: claim.bounty_id,
        claim_id,
        verifier_id: user.id,
        verification_id,
        verified_claim,
        confidence_score: verification.trust_score,
        summary,
      })
      .select()
      .single();

    if (completionError) throw completionError;

    // Update claim status
    await supabaseClient
      .from('bounty_claims')
      .update({ status: 'completed' })
      .eq('id', claim_id);

    // Update bounty status
    await supabaseClient
      .from('truth_bounties')
      .update({ status: 'in_review' })
      .eq('id', claim.bounty_id);

    console.log('Bounty completion submitted:', completion.id);

    // Notify organization
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: claim.truth_bounties.created_by,
        type: 'bounty_completed',
        message: `Bounty "${claim.truth_bounties.title}" has been completed and is ready for review`,
        action_url: `/bounties/${claim.bounty_id}/review`,
        metadata: {
          bounty_id: claim.bounty_id,
          completion_id: completion.id,
        },
      });

    return new Response(JSON.stringify({ success: true, completion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error submitting completion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});