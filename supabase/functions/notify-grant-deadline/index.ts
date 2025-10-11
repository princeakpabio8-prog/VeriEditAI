import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VeriEdit <reminders@veriedit.com>',
        to,
        subject,
        html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function generateDeadlineEmail(data: any): string {
  const { userName, application, daysRemaining } = data;
  const urgency = daysRemaining === 1 ? 'high' : daysRemaining <= 3 ? 'medium' : 'low';
  const urgencyColor = urgency === 'high' ? '#ef4444' : urgency === 'medium' ? '#f59e0b' : '#3b82f6';
  
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${urgencyColor}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">⏰ Grant Deadline Reminder</h1>
        <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0; font-size: 18px; font-weight: 600;">
          ${daysRemaining === 1 ? 'Due Tomorrow!' : `${daysRemaining} days remaining`}
        </p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        
        <p style="font-size: 16px; margin-bottom: 25px;">This is a friendly reminder about your upcoming grant application deadline.</p>
        
        <div style="background: #f9fafb; border-left: 4px solid ${urgencyColor}; padding: 20px; border-radius: 5px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px; color: #1f2937;">${application.organization_name}</h3>
          <p style="margin: 5px 0; color: #6b7280;"><strong>Grant Type:</strong> ${application.grant_type || 'N/A'}</p>
          ${application.funding_amount ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Amount:</strong> $${application.funding_amount.toLocaleString()}</p>` : ''}
          <p style="margin: 5px 0; color: #6b7280;"><strong>Deadline:</strong> ${new Date(application.submission_deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 5px 0; color: #6b7280;"><strong>Status:</strong> ${application.status}</p>
        </div>
        
        ${application.verification_id ? `
        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #166534; font-size: 14px;">✅ <strong>Verification Complete</strong> - Your proposal has been verified and is ready for submission</p>
        </div>
        ` : `
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">⚠️ <strong>Not Yet Verified</strong> - Consider verifying your proposal before submission</p>
        </div>
        `}
        
        <div style="margin: 25px 0;">
          <h4 style="color: #1f2937; margin-bottom: 10px;">Action Items:</h4>
          <ul style="color: #4b5563; line-height: 1.8; margin: 0;">
            ${!application.verification_id ? '<li>Run final verification check on your proposal</li>' : ''}
            <li>Review all supporting documents</li>
            <li>Double-check application requirements</li>
            <li>Prepare submission materials</li>
            ${daysRemaining <= 3 ? '<li style="color: #ef4444; font-weight: 600;">Submit as soon as possible</li>' : ''}
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://veriedit.lovable.app/verify" style="display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            ${application.verification_id ? 'View Verification' : 'Verify Now'}
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>To manage your deadline reminders, <a href="https://veriedit.lovable.app/profile" style="color: #667eea;">update your preferences</a></p>
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get applications with deadlines in the next 7 days
    const { data: upcomingApps, error: appsError } = await supabase
      .from('grant_applications')
      .select('*')
      .eq('email_notifications_enabled', true)
      .in('status', ['draft', 'pending'])
      .gte('submission_deadline', now.toISOString())
      .lte('submission_deadline', sevenDaysFromNow.toISOString());

    if (appsError) throw appsError;

    let emailsSent = 0;

    for (const app of upcomingApps || []) {
      const deadline = new Date(app.submission_deadline);
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only send on specific intervals: 7 days, 3 days, 1 day
      if (![7, 3, 1].includes(daysRemaining)) continue;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email_preferences')
        .eq('user_id', app.user_id)
        .single();

      if (profileError || profile?.email_preferences?.grant_reminders === false) continue;

      // Get user email
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(app.user_id);
      if (authError || !user?.email) continue;

      const emailHtml = generateDeadlineEmail({
        userName: profile.full_name || user.email.split('@')[0],
        application: app,
        daysRemaining,
      });

      const sent = await sendEmail(
        user.email,
        `⏰ Grant Deadline Reminder: ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`,
        emailHtml
      );

      if (sent) emailsSent++;
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Deadline reminder error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
