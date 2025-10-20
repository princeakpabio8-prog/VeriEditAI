import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type') || 'index';

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Generate sitemap index
    if (sitemapType === 'index') {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://verieditai.com/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://verieditai.com/api/sitemap?type=rooms</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://verieditai.com/api/sitemap?type=threads</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://verieditai.com/api/sitemap?type=articles</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://verieditai.com/api/sitemap?type=claims</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

      return new Response(sitemapIndex, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Generate rooms sitemap
    if (sitemapType === 'rooms') {
      const { data: rooms } = await supabaseClient
        .from('lighthouse_rooms')
        .select('id, updated_at, room_type')
        .eq('is_active', true)
        .in('room_type', ['public', 'workspace'])
        .order('updated_at', { ascending: false })
        .limit(50000);

      const urls = (rooms || []).map(room => `  <url>
    <loc>https://verieditai.com/lighthouse/${room.id}</loc>
    <lastmod>${new Date(room.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Generate threads sitemap
    if (sitemapType === 'threads') {
      const { data: threads } = await supabaseClient
        .from('room_threads')
        .select('id, room_id, updated_at, upvote_count')
        .order('updated_at', { ascending: false })
        .limit(50000);

      const urls = (threads || []).map(thread => {
        const priority = thread.upvote_count > 10 ? '0.9' : '0.7';
        return `  <url>
    <loc>https://verieditai.com/lighthouse/${thread.room_id}/thread/${thread.id}</loc>
    <lastmod>${new Date(thread.updated_at).toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=1800',
        },
      });
    }

    // Generate articles sitemap
    if (sitemapType === 'articles') {
      const { data: articles } = await supabaseClient
        .from('news_feed')
        .select('id, updated_at, is_verified, trust_score')
        .eq('is_verified', true)
        .order('updated_at', { ascending: false })
        .limit(50000);

      const urls = (articles || []).map(article => {
        const priority = (article.trust_score || 0) >= 80 ? '0.9' : '0.7';
        return `  <url>
    <loc>https://verieditai.com/article/${article.id}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Generate viral claims sitemap
    if (sitemapType === 'claims') {
      const { data: claims } = await supabaseClient
        .from('viral_claims')
        .select('id, updated_at, virality_score')
        .order('updated_at', { ascending: false })
        .limit(50000);

      const urls = (claims || []).map(claim => {
        const priority = (claim.virality_score || 0) >= 0.7 ? '0.9' : '0.7';
        return `  <url>
    <loc>https://verieditai.com/viral-claims/${claim.id}</loc>
    <lastmod>${new Date(claim.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new Response('Invalid sitemap type', { status: 400 });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
