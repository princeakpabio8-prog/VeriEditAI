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

    const { bounty_id, notes } = await req.json();

    console.log('Claiming bounty:', { bounty_id, user_id: user.id });

    // Check if bounty exists and is active
    const { data: bounty, error: bountyError } = await supabaseClient
      .from('truth_bounties')
      .select('*')
      .eq('id', bounty_id)
      .single();

    if (bountyError) throw bountyError;
    if (bounty.status !== 'active') {
      throw new Error('Bounty is not active');
    }

    // Check if already claimed
    const { data: existingClaim } = await supabaseClient
      .from('bounty_claims')
      .select('*')
      .eq('bounty_id', bounty_id)
      .single();

    if (existingClaim) {
      throw new Error('Bounty has already been claimed');
    }

    // Calculate deadline (7 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    // Create claim
    const { data: claim, error: claimError } = await supabaseClient
      .from('bounty_claims')
      .insert({
        bounty_id,
        verifier_id: user.id,
        deadline: deadline.toISOString(),
        status: 'in_progress',
        notes,
      })
      .select()
      .single();

    if (claimError) throw claimError;

    // Update bounty status
    await supabaseClient
      .from('truth_bounties')
      .update({ status: 'claimed' })
      .eq('id', bounty_id);

    console.log('Bounty claimed successfully:', claim.id);

    // Notify organization
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: bounty.created_by,
        type: 'bounty_claimed',
        message: `Your bounty "${bounty.title}" has been claimed`,
        action_url: `/bounties/${bounty_id}`,
        metadata: {
          bounty_id,
          claim_id: claim.id,
          verifier_id: user.id,
        },
      });

    return new Response(JSON.stringify({ success: true, claim }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error claiming bounty:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});