const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_URL_LENGTH = 2048;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT = 8000; // 8 seconds

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    if (imageUrl.length > MAX_URL_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'URL too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL protocol' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the image
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrustSignalBot-ImageProxy/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch image: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify content type
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'Not an image' }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check content length
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Image too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the image
    const imageHeaders = new Headers(corsHeaders);
    imageHeaders.set('Content-Type', contentType);
    imageHeaders.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    if (contentLength) {
      imageHeaders.set('Content-Length', contentLength);
    }

    return new Response(response.body, {
      status: 200,
      headers: imageHeaders,
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});