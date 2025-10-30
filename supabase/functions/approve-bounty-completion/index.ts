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

    const { completion_id } = await req.json();

    console.log('Approving bounty completion:', completion_id);

    // Get completion details
    const { data: completion, error: completionError } = await supabaseClient
      .from('bounty_completions')
      .select('*, truth_bounties(*)')
      .eq('id', completion_id)
      .single();

    if (completionError) throw completionError;

    // Verify user is the bounty creator
    if (completion.truth_bounties.created_by !== user.id) {
      throw new Error('Unauthorized: Only bounty creator can approve');
    }

    // Approve completion
    await supabaseClient
      .from('bounty_completions')
      .update({
        approved_by_org: true,
        approved_at: new Date().toISOString(),
      })
      .eq('id', completion_id);

    // Update bounty status
    await supabaseClient
      .from('truth_bounties')
      .update({ status: 'completed' })
      .eq('id', completion.bounty_id);

    // Calculate fees
    const serviceFee = Number(completion.truth_bounties.reward_amount) * 0.075; // 7.5%
    const verifierPayout = Number(completion.truth_bounties.reward_amount) - serviceFee;

    // Create earnings record
    const { data: earnings, error: earningsError } = await supabaseClient
      .from('bounty_earnings')
      .insert({
        completion_id,
        bounty_id: completion.bounty_id,
        verifier_id: completion.verifier_id,
        organization_id: completion.truth_bounties.organization_id,
        reward_amount: completion.truth_bounties.reward_amount,
        service_fee: serviceFee,
        verifier_payout: verifierPayout,
        payment_type: completion.truth_bounties.payment_type,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (earningsError) throw earningsError;

    console.log('Earnings record created:', earnings.id);

    // Trigger payment processing
    if (completion.truth_bounties.payment_type === 'fiat') {
      // Process Flutterwave payment
      await supabaseClient.functions.invoke('process-bounty-payment', {
        body: { earnings_id: earnings.id, payment_type: 'fiat' },
      });
    } else {
      // Process crypto payment
      await supabaseClient.functions.invoke('process-bounty-payment', {
        body: { earnings_id: earnings.id, payment_type: 'crypto' },
      });
    }

    // Trigger NFT minting
    await supabaseClient.functions.invoke('mint-truth-badge', {
      body: {
        user_id: completion.verifier_id,
        verification_id: completion.verification_id,
        is_bounty: true,
        bounty_id: completion.bounty_id,
      },
    });

    // Notify verifier
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: completion.verifier_id,
        type: 'bounty_approved',
        message: `Your bounty completion has been approved! Payment is being processed.`,
        action_url: `/bounties/earnings`,
        metadata: {
          earnings_id: earnings.id,
          amount: verifierPayout,
        },
      });

    return new Response(JSON.stringify({ success: true, earnings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error approving completion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});