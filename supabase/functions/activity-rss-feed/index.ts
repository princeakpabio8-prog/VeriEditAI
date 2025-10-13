import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch latest 50 public activities
    const { data: activities } = await supabaseClient
      .from('activity_stream')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    // Generate RSS 2.0 XML
    const rssItems = (activities || []).map(activity => {
      const name = activity.metadata?.username || activity.metadata?.full_name || 'Someone';
      let title = '';
      let description = '';

      switch (activity.activity_type) {
        case 'verification_complete':
          title = `${name} verified a claim`;
          description = `A new verification was completed with trust analysis`;
          break;
        case 'thread_created':
          title = activity.metadata?.title || `${name} created a discussion`;
          description = `New thread: ${activity.metadata?.title}`;
          break;
        case 'high_trust_score':
          title = `${name} achieved ${activity.metadata?.trust_score}% trust score`;
          description = `High-quality verification detected`;
          break;
        default:
          title = `${name} took an action on VeriEdit AI`;
          description = `Activity type: ${activity.activity_type}`;
      }

      const link = activity.activity_type === 'thread_created' && activity.entity_id
        ? `https://verieditai.com/lighthouse/thread/${activity.entity_id}`
        : `https://verieditai.com/activity/${activity.id}`;

      return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${new Date(activity.created_at).toUTCString()}</pubDate>
      <guid>${link}</guid>
      <category>${activity.activity_type}</category>
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VeriEdit AI Activity Feed</title>
    <link>https://verieditai.com/activity-feed</link>
    <description>Real-time verification activity from VeriEdit AI - Fighting misinformation with AI-powered truth verification</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://verieditai.com/rss/activity-feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://verieditai.com/favicon.ico</url>
      <title>VeriEdit AI</title>
      <link>https://verieditai.com</link>
    </image>
${rssItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
      },
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
