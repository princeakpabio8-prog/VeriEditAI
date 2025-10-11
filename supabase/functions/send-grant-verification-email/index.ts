import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VeriEdit <noreply@veriedit.com>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    console.log(`✅ Email sent to ${payload.to}`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

function generateGrantVerificationEmail(data: any): string {
  const { verification, userName, trustScore, status, sources } = data;
  
  const statusColor = trustScore >= 80 ? '#22c55e' : trustScore >= 60 ? '#f59e0b' : '#ef4444';
  const statusText = trustScore >= 80 ? 'Highly Credible' : trustScore >= 60 ? 'Likely Accurate' : 'Needs Review';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Grant Proposal Verification Complete</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Verification Complete</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your grant proposal has been analyzed</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
        
        <p style="font-size: 16px; margin-bottom: 25px;">Your grant proposal verification is ready! Here's what we found:</p>
        
        <div style="background: #f9fafb; border-left: 4px solid ${statusColor}; padding: 20px; border-radius: 5px; margin-bottom: 25px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 20px; color: #1f2937;">Trust Score</h2>
            <span style="font-size: 32px; font-weight: bold; color: ${statusColor};">${trustScore}%</span>
          </div>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Status: <strong style="color: ${statusColor};">${statusText}</strong></p>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Verification Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Sources Analyzed:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; text-align: right;">${sources.length}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Verified Claims:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; text-align: right;">${sources.filter((s: any) => s.reliability_score >= 70).length}</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #6b7280;">Avg. Source Reliability:</td>
            <td style="padding: 12px; font-weight: 600; text-align: right;">${Math.round(sources.reduce((sum: number, s: any) => sum + s.reliability_score, 0) / sources.length)}%</td>
          </tr>
        </table>
        
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 10px; color: #1e40af; font-size: 16px;">💡 Tips for Strengthening Your Application</h4>
          <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
            ${trustScore < 80 ? '<li style="margin-bottom: 8px;">Add citations from authoritative sources to increase credibility</li>' : ''}
            ${sources.filter((s: any) => s.reliability_score < 70).length > 2 ? '<li style="margin-bottom: 8px;">Replace low-reliability sources with peer-reviewed or government publications</li>' : ''}
            <li style="margin-bottom: 8px;">Include specific data points and statistics to support your claims</li>
            <li>Ensure all claims are backed by recent sources (within last 2-3 years)</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://sqtkkzdswxazyikcheds.supabase.co', 'https://veriedit.lovable.app')}/verify?id=${verification.id}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Full Report
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Need to export this for your grant application?</p>
          <p style="margin: 5px 0 0;"><a href="${Deno.env.get('SUPABASE_URL')?.replace('https://sqtkkzdswxazyikcheds.supabase.co', 'https://veriedit.lovable.app')}/verify?id=${verification.id}" style="color: #667eea; text-decoration: none;">Download PDF Report →</a></p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>VeriEdit - Empowering NGOs with AI-Powered Verification</p>
        <p style="margin: 5px 0;"><a href="https://veriedit.lovable.app" style="color: #667eea; text-decoration: none;">veriedit.lovable.app</a></p>
      </div>
    </body>
    </html>
  `;
}

function generateAdminAlertEmail(data: any): string {
  const { user, verificationCount, organizationInfo } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Potential Institutional Client Alert</title>
    </head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 5px;">
        <h2 style="margin: 0 0 15px; color: #92400e;">🎯 High-Value User Alert</h2>
        <p style="margin: 0 0 10px; color: #78350f;">A user has verified <strong>${verificationCount}+ grant proposals</strong>, indicating potential for institutional partnership.</p>
        
        <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px;">
          <h3 style="margin: 0 0 10px; font-size: 16px;">User Details:</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Total Verifications:</strong> ${verificationCount}</p>
          ${organizationInfo ? `<p style="margin: 5px 0;"><strong>Organization:</strong> ${organizationInfo}</p>` : ''}
        </div>
        
        <div style="margin-top: 15px; padding: 15px; background: #dbeafe; border-radius: 5px;">
          <h4 style="margin: 0 0 10px; color: #1e40af;">Recommended Actions:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
            <li>Send partnership invitation email</li>
            <li>Offer bulk verification plan demo</li>
            <li>Discuss API access for team</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verification_id, send_admin_alert } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch verification details
    const { data: verification, error: verError } = await supabase
      .from('verifications')
      .select('*, sources(*)')
      .eq('id', verification_id)
      .single();

    if (verError || !verification) {
      throw new Error('Verification not found');
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, email_preferences')
      .eq('user_id', verification.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Check if user wants verification emails
    if (profile.email_preferences?.verification_complete === false) {
      return new Response(
        JSON.stringify({ success: true, message: 'User has disabled verification emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(verification.user_id);
    if (authError || !user?.email) {
      throw new Error('User email not found');
    }

    // Send verification email
    const emailHtml = generateGrantVerificationEmail({
      verification,
      userName: profile.full_name || user.email.split('@')[0],
      trustScore: verification.trust_score,
      status: verification.status,
      sources: verification.sources || [],
    });

    await sendEmail({
      to: user.email,
      subject: `✅ Your Grant Verification is Ready (${verification.trust_score}% Confidence)`,
      html: emailHtml,
    });

    // Check if should send admin alert
    if (send_admin_alert) {
      const { data: userVerifications, error: countError } = await supabase
        .from('verifications')
        .select('id', { count: 'exact' })
        .eq('user_id', verification.user_id)
        .eq('category', 'ngo-grant');

      const verificationCount = userVerifications?.length || 0;

      if (verificationCount >= 5) {
        const adminAlertHtml = generateAdminAlertEmail({
          user,
          verificationCount,
          organizationInfo: profile.metadata?.organization,
        });

        await sendEmail({
          to: 'admin@veriedit.com', // Replace with actual admin email
          subject: `🎯 Potential Institutional Client: ${user.email}`,
          html: adminAlertHtml,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
