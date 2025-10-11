import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
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
        from: 'VeriEdit <digest@veriedit.com>',
        to,
        subject,
        html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

function generateDigestEmail(data: any): string {
  const { userName, stats, tips, opportunities } = data;
  const avgScore = stats.avgTrustScore;
  const scoreColor = avgScore >= 80 ? '#22c55e' : avgScore >= 60 ? '#f59e0b' : '#ef4444';
  
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📊 Monthly Grant Digest</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your verification summary for this month</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hi ${userName},</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0 0 15px; color: #1f2937;">This Month's Performance</h2>
          <div style="display: grid; gap: 15px;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Total Grants Verified</p>
              <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold; color: #1f2937;">${stats.totalGrants}</p>
            </div>
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Average Trust Score</p>
              <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold; color: ${scoreColor};">${avgScore}%</p>
            </div>
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Success Rate Trend</p>
              <p style="margin: 5px 0 0; font-size: 18px; font-weight: 600; color: ${stats.trend === 'up' ? '#22c55e' : '#f59e0b'};">
                ${stats.trend === 'up' ? '📈 Improving' : '📊 Steady'}
              </p>
            </div>
          </div>
        </div>
        
        <div style="margin: 25px 0;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">💡 Tips for Improving Your Applications</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            ${tips.map((tip: string) => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
        
        ${opportunities.length > 0 ? `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px; color: #1e40af;">🎯 Funding Opportunities</h3>
          <p style="margin: 0 0 10px; color: #1e3a8a; font-size: 14px;">Based on your verification history, these opportunities might interest you:</p>
          <ul style="margin: 0; color: #1e3a8a;">
            ${opportunities.map((opp: string) => `<li style="margin: 8px 0;">${opp}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://veriedit.lovable.app/verify" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Verify Another Grant
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>To unsubscribe from monthly digests, <a href="https://veriedit.lovable.app/profile" style="color: #667eea;">update your preferences</a></p>
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

    // Get users who verified grant content in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentVerifications, error: verError } = await supabase
      .from('verifications')
      .select('user_id, trust_score, created_at')
      .eq('category', 'ngo-grant')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (verError) throw verError;

    // Group by user
    const userStats = new Map();
    recentVerifications?.forEach(v => {
      if (!userStats.has(v.user_id)) {
        userStats.set(v.user_id, { scores: [], count: 0 });
      }
      const stats = userStats.get(v.user_id);
      stats.scores.push(v.trust_score);
      stats.count++;
    });

    let emailsSent = 0;

    // Send digest to each user
    for (const [userId, stats] of userStats.entries()) {
      if (stats.count === 0) continue;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email_preferences')
        .eq('user_id', userId)
        .single();

      if (profileError || profile?.email_preferences?.grant_digest === false) continue;

      // Get user email
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError || !user?.email) continue;

      const avgScore = Math.round(stats.scores.reduce((a: number, b: number) => a + b, 0) / stats.scores.length);
      
      const tips = [
        'Use recent sources (within 2-3 years) to demonstrate current relevance',
        'Include specific metrics and data points to strengthen credibility',
        'Cite government or academic sources for maximum trust score',
        avgScore < 80 ? 'Replace low-reliability sources with authoritative publications' : 'Maintain consistency across all claims for better coherence',
      ];

      const opportunities = [
        'Global Climate Action Fund - Deadline: March 31, 2025',
        'Education Innovation Grant - Rolling applications',
        'Healthcare Access Initiative - Q2 2025 cycle open',
      ];

      const emailHtml = generateDigestEmail({
        userName: profile.full_name || user.email.split('@')[0],
        stats: {
          totalGrants: stats.count,
          avgTrustScore: avgScore,
          trend: avgScore >= 70 ? 'up' : 'steady',
        },
        tips,
        opportunities: avgScore >= 70 ? opportunities : [],
      });

      const sent = await sendEmail(
        user.email,
        `📊 Your Monthly Grant Digest - ${stats.count} Verifications`,
        emailHtml
      );

      if (sent) emailsSent++;
    }

    return new Response(
      JSON.stringify({ success: true, emails_sent: emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Digest sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
