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
      organization_id,
      title,
      description,
      claim_to_verify,
      category,
      tags,
      reward_amount,
      reward_currency,
      payment_type,
      expires_at,
      min_trust_score,
      required_sources,
    } = await req.json();

    console.log('Creating truth bounty:', { organization_id, title, category });

    // Create the bounty
    const { data: bounty, error: bountyError } = await supabaseClient
      .from('truth_bounties')
      .insert({
        organization_id,
        created_by: user.id,
        title,
        description,
        claim_to_verify,
        category: category || 'general',
        tags: tags || [],
        reward_amount,
        reward_currency: reward_currency || 'USD',
        payment_type: payment_type || 'fiat',
        expires_at,
        min_trust_score: min_trust_score || 50,
        required_sources: required_sources || 3,
        status: 'active',
      })
      .select()
      .single();

    if (bountyError) throw bountyError;

    console.log('Bounty created successfully:', bounty.id);

    // Trigger auto-ping notifications
    const { data: autoPingData, error: autoPingError } = await supabaseClient.functions.invoke(
      'send-bounty-auto-pings',
      {
        body: { bounty_id: bounty.id, category: bounty.category },
      }
    );

    if (autoPingError) {
      console.error('Auto-ping error:', autoPingError);
    } else {
      console.log('Auto-ping notifications sent:', autoPingData);
    }

    return new Response(JSON.stringify({ success: true, bounty }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating bounty:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});