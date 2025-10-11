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
        from: 'VeriEdit Partnerships <partnerships@veriedit.com>',
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

function generatePartnershipEmail(data: any): string {
  const { organizationName, stats, userName } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">💼 Unlock Premium Verification</h1>
        <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0; font-size: 18px;">Designed for NGOs & Grant Teams</p>
      </div>
      
      <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          We noticed that ${organizationName || 'your organization'} has verified <strong>${stats.totalVerifications} grant proposals</strong> 
          with an average trust score of <strong>${stats.avgTrustScore}%</strong>. Impressive work! 🎉
        </p>
        
        <div style="background: #f9fafb; border-radius: 10px; padding: 25px; margin: 30px 0;">
          <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Your Success Story</h2>
          <div style="display: grid; gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Total Verifications</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #667eea;">${stats.totalVerifications}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Average Trust Score</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #22c55e;">${stats.avgTrustScore}%</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Success Rate</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #667eea;">${stats.successRate}%</p>
            </div>
          </div>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">Upgrade to VeriEdit Pro</h3>
          <p style="color: #4b5563; margin-bottom: 20px;">Take your grant verification to the next level with our institutional plan:</p>
          
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; line-height: 2;">
              <li><strong>Unlimited verifications</strong> for your entire team</li>
              <li><strong>API access</strong> for automated verification workflows</li>
              <li><strong>Bulk verification</strong> - process multiple grants simultaneously</li>
              <li><strong>Custom templates</strong> tailored to your funding sources</li>
              <li><strong>Priority support</strong> with dedicated account manager</li>
              <li><strong>Advanced analytics</strong> and reporting dashboard</li>
              <li><strong>Team collaboration</strong> features and shared workspace</li>
            </ul>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
          <h4 style="margin: 0 0 10px; color: #92400e; font-size: 18px;">🎁 Special Offer</h4>
          <p style="margin: 0; color: #78350f; font-size: 16px;">
            As a valued user, get <strong>20% off</strong> your first 3 months when you upgrade this week
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 35px;">
          <a href="https://veriedit.lovable.app/billing?plan=enterprise&promo=NGO20" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
            Schedule a Demo
          </a>
        </div>
        
        <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            Questions? Reply to this email or <a href="mailto:partnerships@veriedit.com" style="color: #667eea; text-decoration: none;">contact our partnerships team</a>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 5px 0;">VeriEdit - Empowering NGOs Worldwide</p>
        <p style="margin: 5px 0;"><a href="https://veriedit.lovable.app" style="color: #667eea; text-decoration: none;">veriedit.lovable.app</a></p>
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
    const { user_id, organization_name } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user verification stats
    const { data: verifications, error: verError } = await supabase
      .from('verifications')
      .select('trust_score, status')
      .eq('user_id', user_id)
      .eq('category', 'ngo-grant');

    if (verError) throw verError;

    const totalVerifications = verifications?.length || 0;
    
    // Only send if user has 10+ verifications
    if (totalVerifications < 10) {
      return new Response(
        JSON.stringify({ success: false, message: 'User does not meet threshold for partnership invite' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const avgTrustScore = Math.round(
      verifications.reduce((sum, v) => sum + (v.trust_score || 0), 0) / totalVerifications
    );
    
    const successRate = Math.round(
      (verifications.filter(v => (v.trust_score || 0) >= 70).length / totalVerifications) * 100
    );

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email_preferences')
      .eq('user_id', user_id)
      .single();

    if (profileError || profile?.email_preferences?.partnership_invites === false) {
      return new Response(
        JSON.stringify({ success: false, message: 'User has disabled partnership emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(user_id);
    if (authError || !user?.email) throw new Error('User email not found');

    const emailHtml = generatePartnershipEmail({
      organizationName: organization_name,
      userName: profile.full_name || user.email.split('@')[0],
      stats: {
        totalVerifications,
        avgTrustScore,
        successRate,
      },
    });

    const sent = await sendEmail(
      user.email,
      '💼 Unlock VeriEdit Pro - Designed for Your Organization',
      emailHtml
    );

    if (!sent) throw new Error('Failed to send email');

    return new Response(
      JSON.stringify({ success: true, message: 'Partnership invitation sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Partnership invite error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
