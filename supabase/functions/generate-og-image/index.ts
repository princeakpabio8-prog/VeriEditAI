import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.6/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OGImageRequest {
  contentType: 'verification' | 'thread';
  title: string;
  trustScore?: number;
  content?: string;
  author?: string;
  stats?: {
    views?: number;
    shares?: number;
    comments?: number;
  };
}

function getGradientColors(trustScore?: number): { start: string; end: string } {
  if (trustScore === undefined) return { start: '#3b82f6', end: '#1d4ed8' };
  
  if (trustScore >= 70) return { start: '#10b981', end: '#059669' }; // Green
  if (trustScore >= 40) return { start: '#f59e0b', end: '#d97706' }; // Orange
  return { start: '#ef4444', end: '#dc2626' }; // Red
}

async function generatePNG(data: OGImageRequest) {
  const { contentType, title, trustScore, content, author, stats, platform, engagementScore, status } = data;
  const colors = getGradientColors(trustScore);
  const displayTrustScore = trustScore !== undefined ? Math.round(trustScore) : null;
  const contentPreview = content ? content.substring(0, 150) : '';
  
  // For viral claims, show different header
  const headerBadge = contentType === 'viral_claim' 
    ? `🔥 ${status?.toUpperCase() || 'TRENDING'} on ${platform || 'Social Media'}`
    : '✓ Verified';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${colors.start}, ${colors.end})`,
          padding: 60,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        children: [
          // Header
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', marginBottom: 40 },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 32, fontWeight: 700, color: 'white' },
                    children: 'VeriedIT AI',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      marginLeft: 20,
                      padding: '8px 24px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 20,
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'white',
                    },
                    children: headerBadge,
                  },
                },
              ],
            },
          },
          // Main Content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: 40,
                flex: 1,
              },
              children: [
                // Trust Score Card (if available) or Engagement Score for viral claims
                (displayTrustScore !== null || (contentType === 'viral_claim' && engagementScore)) && {
                  type: 'div',
                  props: {
                    style: {
                      width: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.15)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: 20,
                      padding: 40,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 20, fontWeight: 600, color: 'white', marginBottom: 20 },
                          children: contentType === 'viral_claim' ? 'ENGAGEMENT' : 'TRUST SCORE',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 80, fontWeight: 700, color: 'white' },
                          children: contentType === 'viral_claim' 
                            ? `${Math.round((engagementScore || 0) / 1000)}K`
                            : `${displayTrustScore}%`,
                        },
                      },
                    ],
                  },
                },
                // Content Area
                {
                  type: 'div',
                  props: {
                    style: {
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(255,255,255,0.15)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: 20,
                      padding: 40,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 20 },
                          children: title.substring(0, 60) + (title.length > 60 ? '...' : ''),
                        },
                      },
                      contentPreview && {
                        type: 'div',
                        props: {
                          style: { fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 20 },
                          children: contentPreview.substring(0, 100) + '...',
                        },
                      },
                      author && {
                        type: 'div',
                        props: {
                          style: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 'auto' },
                          children: `By ${author}`,
                        },
                      },
                      stats && (stats.views || stats.shares || stats.comments) && {
                        type: 'div',
                        props: {
                          style: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 10 },
                          children: [
                            stats.views && `👁 ${stats.views} views`,
                            stats.shares && ` • 🔗 ${stats.shares} shares`,
                            stats.comments && ` • 💬 ${stats.comments} comments`,
                          ].filter(Boolean).join(''),
                        },
                      },
                    ].filter(Boolean),
                  },
                },
              ].filter(Boolean),
            },
          },
          // Footer
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 40,
                paddingTop: 20,
                borderTop: '2px solid rgba(255,255,255,0.3)',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 20, fontWeight: 600, color: 'white' },
                    children: 'AI-Powered Truth Verification',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
                    children: 'veried.it',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: OGImageRequest = await req.json();
    console.log('Generating OG image for:', requestData);

    // Generate PNG image
    const imageResponse = await generatePNG(requestData);
    const pngBuffer = await imageResponse.arrayBuffer();
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `og-${requestData.contentType}-${timestamp}.png`;
    const filePath = `${filename}`;

    console.log(`Uploading PNG image: ${filePath} (${pngBuffer.byteLength} bytes)`);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('og-images')
      .upload(filePath, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '86400', // 24 hours
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('og-images')
      .getPublicUrl(filePath);

    console.log('OG image generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        imageUrl: publicUrl,
        filename: filePath
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
