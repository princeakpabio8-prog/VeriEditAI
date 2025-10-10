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
    const { organization_id, contact_name, contact_email, contact_website, message } = await req.json();

    if (!organization_id || !contact_name || !contact_email) {
      throw new Error('Missing required fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📧 Processing partnership request for org: ${organization_id}`);

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    // Create partnership request
    const { data: request, error: requestError } = await supabase
      .from('partnership_requests')
      .insert({
        organization_id,
        contact_name,
        contact_email,
        contact_website,
        message,
      })
      .select()
      .single();

    if (requestError) {
      console.error('❌ Failed to create request:', requestError);
      throw requestError;
    }

    // Send email notification (using Resend or similar)
    // For now, we'll log it - you can integrate Resend later
    const emailContent = `
New Partnership Request from ${org.name}

Organization: ${org.name}
Domain: ${org.domain}
Industry: ${org.industry}

Contact Information:
Name: ${contact_name}
Email: ${contact_email}
Website: ${contact_website || 'Not provided'}

Message:
${message || 'No message provided'}

Current Stats:
Trust Score: ${org.avg_trust_score}/100
Total Verifications: ${org.total_verifications}

View Profile: ${supabaseUrl}/lighthouse/organizations/${org.id}

---
Sent from VeriEdit Verification Partnership System
    `;

    console.log('📬 Email to send to hello@verieditai.com:');
    console.log(emailContent);

    // TODO: Integrate with Resend to send actual email
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // await resend.emails.send({
    //   from: 'partnerships@verieditai.com',
    //   to: 'hello@verieditai.com',
    //   subject: `New Partnership Request from ${org.name}`,
    //   text: emailContent,
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Partnership request submitted successfully',
        request_id: request.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Partnership request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
