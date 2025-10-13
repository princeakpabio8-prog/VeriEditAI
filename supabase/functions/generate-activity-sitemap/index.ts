import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch high-value activities (viewed or shared)
    const { data: activities } = await supabaseClient
      .from('activity_stream')
      .select('id, activity_type, entity_id, created_at, view_count, share_count')
      .eq('is_public', true)
      .or('view_count.gte.10,share_count.gte.5')
      .order('created_at', { ascending: false })
      .limit(50000); // Google's limit

    // Generate sitemap URLs
    const urls = (activities || []).map(activity => {
      let loc = `https://verieditai.com/activity/${activity.id}`;
      let priority = '0.6';
      let changefreq = 'daily';

      // Higher priority for specific types
      if (activity.activity_type === 'thread_created' && activity.entity_id) {
        loc = `https://verieditai.com/lighthouse/thread/${activity.entity_id}`;
        priority = '0.8';
        changefreq = 'hourly';
      } else if (activity.view_count > 100 || activity.share_count > 20) {
        priority = '0.7';
      }

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date(activity.created_at).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // 24 hours cache
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
