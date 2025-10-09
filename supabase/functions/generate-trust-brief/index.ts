import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get data from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get trust analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('trust_analytics')
      .select('*')
      .gte('created_at', sevenDaysAgo)
      .order('average_trust_score', { ascending: true });

    if (analyticsError) throw analyticsError;

    // Get global snapshots for trend
    const { data: snapshots, error: snapshotError } = await supabase
      .from('trust_index_snapshots')
      .select('*')
      .gte('snapshot_date', sevenDaysAgo.split('T')[0])
      .order('snapshot_date', { ascending: false });

    if (snapshotError) throw snapshotError;

    const latestSnapshot = snapshots?.[0];
    const oldestSnapshot = snapshots?.[snapshots.length - 1];

    // Calculate trends
    const trustScoreChange = latestSnapshot && oldestSnapshot
      ? (latestSnapshot.global_trust_index - oldestSnapshot.global_trust_index).toFixed(1)
      : '0';

    // Find top misinformation trends (lowest trust scores)
    const misinformationTrends = analytics
      ?.filter(a => a.average_trust_score < 50)
      .slice(0, 3)
      .map(a => ({
        region: a.region,
        topic: a.topic,
        score: a.average_trust_score,
        change: a.week_over_week_change
      })) || [];

    // Find top credible sources (highest trust scores)
    const credibleSources = analytics
      ?.filter(a => a.average_trust_score >= 80)
      .sort((a, b) => b.week_over_week_change - a.week_over_week_change)
      .slice(0, 3)
      .map(a => ({
        domain: a.domain,
        score: a.average_trust_score,
        change: a.week_over_week_change
      })) || [];

    // Generate brief using Lovable AI (Gemini)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const briefPrompt = `Generate a concise Weekly Trust Intelligence Brief based on this data:

**Global Trust Index**: ${latestSnapshot?.global_trust_index || 'N/A'} (${trustScoreChange >= 0 ? '+' : ''}${trustScoreChange}% vs last week)
**High Credibility Percentage**: ${latestSnapshot?.high_credibility_percentage || 'N/A'}%
**Total Verifications**: ${latestSnapshot?.total_verifications || 'N/A'}

**Misinformation Hotspots**:
${misinformationTrends.map(t => `- ${t.region} (${t.topic}): ${t.score}/100 trust score, ${t.change >= 0 ? '+' : ''}${t.change}% change`).join('\n')}

**Top Credible Sources**:
${credibleSources.map(s => `- ${s.domain}: ${s.score}/100, ${s.change >= 0 ? '+' : ''}${s.change}% improvement`).join('\n')}

**Trending Low Trust Topics**: ${latestSnapshot?.trending_low_topics?.join(', ') || 'None'}

Format as markdown with sections:
1. 🚨 Misinformation Hotspots
2. ✅ High-Credibility Sources This Week
3. 📊 Global Trust Index
4. 💡 Actionable Insights

Keep it under 500 words, executive-friendly.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a trust intelligence analyst creating weekly executive briefings.' },
          { role: 'user', content: briefPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const briefContent = aiData.choices[0].message.content;

    // Calculate week range
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Store brief in database
    const { data: brief, error: briefError } = await supabase
      .from('trust_briefs')
      .insert({
        week_start: weekStart.toISOString(),
        week_end: now.toISOString(),
        brief_content: briefContent,
        metadata: {
          global_trust_index: latestSnapshot?.global_trust_index,
          trust_score_change: parseFloat(trustScoreChange),
          misinformation_trends: misinformationTrends,
          credible_sources: credibleSources,
          generated_at: now.toISOString()
        }
      })
      .select()
      .single();

    if (briefError) throw briefError;

    console.log('✅ Weekly trust brief generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        brief_id: brief.id,
        week_range: `${weekStart.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
        preview: briefContent.substring(0, 200) + '...'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trust brief generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});