import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bounty_id, category } = await req.json();

    console.log('Sending auto-ping notifications for bounty:', bounty_id, 'category:', category);

    // Get bounty details
    const { data: bounty, error: bountyError } = await supabaseClient
      .from('truth_bounties')
      .select('*, organizations(*)')
      .eq('id', bounty_id)
      .single();

    if (bountyError) throw bountyError;

    // Get top verifiers in this category
    const { data: topVerifiers, error: verifiersError } = await supabaseClient
      .rpc('get_top_verifiers_by_category', {
        p_category: category,
        p_limit: 20
      });

    if (verifiersError) {
      console.error('Error fetching verifiers:', verifiersError);
    }

    // Get verifiers with matching preferences
    const { data: interestedVerifiers, error: prefsError } = await supabaseClient
      .from('verifier_preferences')
      .select('user_id, profiles(*)')
      .contains('preferred_categories', [category])
      .eq('auto_ping_enabled', true)
      .gte('min_reward_amount', bounty.reward_amount);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
    }

    // Combine and deduplicate verifiers
    const allVerifiers = new Map();
    
    if (topVerifiers) {
      topVerifiers.forEach(v => allVerifiers.set(v.user_id, v));
    }
    
    if (interestedVerifiers) {
      interestedVerifiers.forEach(v => allVerifiers.set(v.user_id, v));
    }

    console.log(`Found ${allVerifiers.size} verifiers to notify`);

    // Get partner organizations in same category
    const { data: partners, error: partnersError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('verified_partner', true)
      .neq('id', bounty.organization_id);

    if (partnersError) {
      console.error('Error fetching partners:', partnersError);
    }

    let pingsSent = 0;
    const emailPromises = [];

    // Send notifications to verifiers
    for (const [userId, verifier] of allVerifiers) {
      // Get user email
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profile) continue;

      const { data: authUser } = await supabaseClient.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;

      if (!email) continue;

      // Log the ping
      const { error: pingError } = await supabaseClient
        .from('bounty_auto_pings')
        .insert({
          bounty_id,
          recipient_type: 'verifier',
          recipient_id: userId,
          recipient_email: email,
          category,
          status: 'sent',
        });

      if (pingError) {
        console.error('Error logging ping:', pingError);
      }

      // Send email notification using Resend
      if (RESEND_API_KEY) {
        const emailPromise = fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'VeriEdit AI <bounties@veriedit.ai>',
            to: email,
            subject: `🎯 New Truth Bounty: ${bounty.title}`,
            html: `
              <h2>New Truth Bounty Available!</h2>
              <p>Hi ${profile.full_name || 'Verifier'},</p>
              <p>A new bounty matching your expertise has been posted:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>${bounty.title}</h3>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Reward:</strong> ${bounty.reward_currency} ${bounty.reward_amount}</p>
                <p><strong>Organization:</strong> ${bounty.organizations?.name || 'Unknown'}</p>
                <p><strong>Claim:</strong> ${bounty.claim_to_verify}</p>
              </div>
              <p><a href="https://veriedit.ai/bounties/${bounty.id}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Bounty</a></p>
              <p style="color: #666; font-size: 12px;">You're receiving this because you've opted into bounty notifications for ${category} category.</p>
            `,
          }),
        });

        emailPromises.push(emailPromise);
      }

      pingsSent++;

      // Create in-app notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'bounty_available',
          message: `New ${category} bounty: ${bounty.title}`,
          action_url: `/bounties/${bounty.id}`,
          metadata: {
            bounty_id,
            category,
            reward_amount: bounty.reward_amount,
          },
        });
    }

    // Send notifications to partner organizations
    if (partners) {
      for (const partner of partners) {
        if (!partner.contact_email) continue;

        const { error: pingError } = await supabaseClient
          .from('bounty_auto_pings')
          .insert({
            bounty_id,
            recipient_type: 'partner',
            recipient_id: partner.id,
            recipient_email: partner.contact_email,
            category,
            status: 'sent',
          });

        if (pingError) {
          console.error('Error logging partner ping:', pingError);
        }

        if (RESEND_API_KEY) {
          const emailPromise = fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'VeriEdit AI <bounties@veriedit.ai>',
              to: partner.contact_email,
              subject: `Partnership Opportunity: New ${category} Truth Bounty`,
              html: `
                <h2>New Truth Bounty Partnership Opportunity</h2>
                <p>Dear ${partner.name} team,</p>
                <p>A new verification bounty has been posted in your area of expertise:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>${bounty.title}</h3>
                  <p><strong>Category:</strong> ${category}</p>
                  <p><strong>Organization:</strong> ${bounty.organizations?.name || 'Unknown'}</p>
                </div>
                <p>This may be relevant to your fact-checking work.</p>
              `,
            }),
          });

          emailPromises.push(emailPromise);
        }

        pingsSent++;
      }
    }

    // Wait for all emails to be sent
    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
    }

    // Update bounty with ping status
    await supabaseClient
      .from('truth_bounties')
      .update({
        auto_ping_sent: true,
        auto_ping_count: pingsSent,
      })
      .eq('id', bounty_id);

    console.log(`Sent ${pingsSent} auto-ping notifications`);

    return new Response(
      JSON.stringify({ success: true, pings_sent: pingsSent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending auto-pings:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});