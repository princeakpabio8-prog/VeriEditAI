import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function generateSVG(data: OGImageRequest): string {
  const { contentType, title, trustScore, content, author, stats } = data;
  
  // Determine gradient based on trust score
  let gradientColors = ['#3b82f6', '#1d4ed8']; // Default blue
  if (trustScore !== undefined) {
    if (trustScore >= 70) {
      gradientColors = ['#10b981', '#059669']; // Green
    } else if (trustScore >= 40) {
      gradientColors = ['#f59e0b', '#d97706']; // Orange
    } else {
      gradientColors = ['#ef4444', '#dc2626']; // Red
    }
  }
  
  const contentPreview = content ? content.substring(0, 150) + '...' : '';
  const displayTrustScore = trustScore !== undefined ? Math.round(trustScore) : null;
  
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradientColors[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradientColors[1]};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="card-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg-gradient)"/>
      
      <!-- Pattern overlay -->
      <rect width="1200" height="630" fill="url(#card-gradient)" opacity="0.3"/>
      
      <!-- Logo and badge area -->
      <text x="60" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="white">
        VeriedIT AI
      </text>
      <rect x="240" y="50" width="140" height="40" rx="20" fill="rgba(255,255,255,0.2)"/>
      <text x="310" y="76" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">
        ✓ Verified
      </text>
      
      <!-- Trust Score Card -->
      ${displayTrustScore !== null ? `
      <rect x="60" y="140" width="280" height="200" rx="20" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <text x="200" y="190" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="white" text-anchor="middle">
        TRUST SCORE
      </text>
      <text x="200" y="265" font-family="Arial, sans-serif" font-size="80" font-weight="700" fill="white" text-anchor="middle">
        ${displayTrustScore}%
      </text>
      ` : ''}
      
      <!-- Content area -->
      <rect x="380" y="140" width="760" height="340" rx="20" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      
      <!-- Title -->
      <text x="420" y="200" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="white">
        ${title.substring(0, 40)}${title.length > 40 ? '...' : ''}
      </text>
      
      <!-- Content preview -->
      ${contentPreview ? `
      <text x="420" y="250" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.9)">
        ${contentPreview.split(' ').slice(0, 15).join(' ')}
      </text>
      ` : ''}
      
      <!-- Author -->
      ${author ? `
      <text x="420" y="330" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">
        By ${author}
      </text>
      ` : ''}
      
      <!-- Stats -->
      ${stats ? `
      <text x="420" y="400" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">
        ${stats.views ? `👁 ${stats.views} views` : ''} 
        ${stats.shares ? `• 🔗 ${stats.shares} shares` : ''} 
        ${stats.comments ? `• 💬 ${stats.comments} comments` : ''}
      </text>
      ` : ''}
      
      <!-- Footer -->
      <rect y="580" width="1200" height="50" fill="rgba(0,0,0,0.3)"/>
      <text x="60" y="613" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="white">
        AI-Powered Truth Verification
      </text>
      <text x="1140" y="613" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="end">
        veried.it
      </text>
    </svg>
  `;
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

    // Generate SVG
    const svg = generateSVG(requestData);
    
    // Convert SVG to PNG using a simple base64 approach
    // For production, consider using a proper SVG to PNG converter
    const svgBuffer = new TextEncoder().encode(svg);
    const svgBase64 = btoa(String.fromCharCode(...new Uint8Array(svgBuffer)));
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `og-${requestData.contentType}-${timestamp}.svg`;
    const filePath = `${filename}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('og-images')
      .upload(filePath, svgBuffer, {
        contentType: 'image/svg+xml',
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

    console.log('OG image generated:', publicUrl);

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
