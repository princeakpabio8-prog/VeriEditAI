import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const pathParts = url.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
      return new Response('Blog slug is required', { status: 400 });
    }

    const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
    const isBot = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|pinterest|reddit/i.test(userAgent);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return new Response('Blog post not found', { status: 404 });
    }

    // The published app URL where users should land
    const appUrl = `https://trust-lighthouse.lovable.app/blog/${slug}`;
    const sharePageUrl = `${supabaseUrl}/functions/v1/blog-share/${slug}`;
    
    // Build absolute image URL
    let ogImage = post.cover_image_url || '';
    if (ogImage && !ogImage.startsWith('http')) {
      ogImage = `https://trust-lighthouse.lovable.app${ogImage}`;
    }
    if (!ogImage) {
      ogImage = 'https://trust-lighthouse.lovable.app/assets/lighthouse-hero.jpg';
    }

    const ogTitle = post.meta_title || post.title;
    const ogDescription = post.meta_description || post.excerpt || post.content.slice(0, 155);
    const readTime = post.reading_time_minutes || Math.ceil(post.content.split(/\s+/).length / 200);

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id);

    // For bots: return rich HTML with OG tags
    if (isBot) {
      const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)} | VeriEdit AI Blog</title>
  <meta name="description" content="${escapeHtml(ogDescription)}">
  <meta name="author" content="VeriEdit AI">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1920">
  <meta property="og:image:height" content="1080">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:url" content="${sharePageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="VeriEdit AI - Trust Verification Platform">
  ${post.published_at ? `<meta property="article:published_time" content="${post.published_at}">` : ''}
  <meta property="article:author" content="VeriEdit AI">
  ${(post.tags || []).map((t: string) => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n  ')}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@verieditai">
  <meta name="twitter:creator" content="@princeakpabio">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="twitter:image:alt" content="${escapeHtml(post.title)}">
  <meta name="twitter:label1" content="Reading time">
  <meta name="twitter:data1" content="${readTime} min read">
  <meta name="twitter:label2" content="Category">
  <meta name="twitter:data2" content="${escapeHtml((post.category || 'general').replace('-', ' '))}">

  <!-- LinkedIn specific -->
  <meta property="og:locale" content="en_US">

  <link rel="canonical" href="${appUrl}">
  <meta http-equiv="refresh" content="0; url=${appUrl}">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #0a0a0a; color: #e5e5e5;">
  <div style="max-width: 680px; margin: 0 auto;">
    ${ogImage ? `<img src="${ogImage}" alt="${escapeHtml(post.title)}" style="width: 100%; border-radius: 12px; margin-bottom: 24px;">` : ''}
    <h1 style="font-size: 28px; line-height: 1.3; margin-bottom: 12px;">${escapeHtml(post.title)}</h1>
    <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${escapeHtml(ogDescription)}</p>
    <p style="color: #737373; font-size: 14px; margin-bottom: 24px;">${readTime} min read · ${post.category || 'General'}</p>
    <a href="${appUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Read Full Article →
    </a>
  </div>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
    }

    // For real users: redirect to the app
    return new Response(null, {
      status: 302,
      headers: { 'Location': appUrl, ...corsHeaders },
    });

  } catch (error) {
    console.error('blog-share error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
