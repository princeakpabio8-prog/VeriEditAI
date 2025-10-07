import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shareToken = pathParts[pathParts.length - 1];

    if (!shareToken) {
      return new Response('Share token is required', { status: 400 });
    }

    // Detect social media bots
    const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
    const isBot = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot/i.test(userAgent);

    console.log(`Request for token: ${shareToken}, User-Agent: ${userAgent}, isBot: ${isBot}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch verification data
    const { data: publicVerification, error } = await supabase
      .from('public_verifications')
      .select(`
        share_token,
        view_count,
        og_title,
        og_description,
        og_image_url,
        verification_id,
        verifications!inner (
          trust_score,
          result_summary,
          content,
          created_at
        )
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (error || !publicVerification) {
      console.error('Error fetching verification:', error);
      return new Response('Verification not found', { status: 404 });
    }

    const verification = (publicVerification as any).verifications;
    const trustScore = verification.trust_score || 0;
    
    // Generate dynamic OG tags
    const ogTitle = publicVerification.og_title || `Trust Score: ${trustScore}% - Verified by VeriedIT AI`;
    const ogDescription = publicVerification.og_description || verification.result_summary || 'View verification results and analysis';
    const ogImage = publicVerification.og_image_url || 'https://sqtkkzdswxazyikcheds.supabase.co/storage/v1/object/public/assets/lighthouse-hero.jpg';
    const shareUrl = `https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/share-page/${shareToken}`;
    const appUrl = `${supabaseUrl.replace('//', '//preview--')}/share/${shareToken}`;

    // Increment view count
    await supabase
      .from('public_verifications')
      .update({ view_count: (publicVerification.view_count || 0) + 1 })
      .eq('share_token', shareToken);

    // For bots: Return HTML with OG meta tags
    if (isBot) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="VeriedIT AI - Fact Verification">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Redirect for JavaScript-enabled bots -->
  <meta http-equiv="refresh" content="0; url=${appUrl}">
  <script>
    window.location.replace('${appUrl}');
  </script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Verification Results</h1>
    <div style="font-size: 48px; font-weight: bold; color: ${trustScore >= 70 ? '#22c55e' : trustScore >= 40 ? '#f59e0b' : '#ef4444'}; margin: 20px 0;">
      ${trustScore}%
    </div>
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
      ${verification.result_summary || 'Redirecting to full verification results...'}
    </p>
    <a href="${appUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View Full Report
    </a>
  </div>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        }
      });
    }

    // For regular users: Redirect to React app
    return new Response(null, {
      status: 302,
      headers: {
        'Location': appUrl,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error in share-page function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
