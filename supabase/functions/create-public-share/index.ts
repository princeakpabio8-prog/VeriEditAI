import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareRequest {
  verificationId: string;
  expiresIn?: number; // Days until expiration (optional)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { verificationId, expiresIn }: ShareRequest = await req.json();

    if (!verificationId) {
      return new Response(
        JSON.stringify({ error: 'Missing verificationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this verification
    const { data: verification, error: verifyError } = await supabase
      .from('verifications')
      .select('id, content, result_summary, trust_score, status')
      .eq('id', verificationId)
      .eq('user_id', user.id)
      .single();

    if (verifyError || !verification) {
      console.error('Verification check error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Verification not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share already exists for this verification
    const { data: existingShare } = await supabase
      .from('public_verifications')
      .select('share_token')
      .eq('verification_id', verificationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingShare) {
      // Return existing share - use request origin for proper URL
      const origin = req.headers.get('origin') || 'https://veriedit-ai.lovable.app';
      const shareUrl = `${origin}/share/${existingShare.share_token}`;
      
      console.log('Returning existing share:', { shareToken: existingShare.share_token, shareUrl });
      
      return new Response(
        JSON.stringify({ 
          shareUrl,
          shareToken: existingShare.share_token,
          message: 'Using existing share link'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate cryptographically secure share token
    const shareToken = crypto.randomUUID();

    // Calculate expiration date if provided
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Generate SEO meta tags
    const ogTitle = `Trust Score: ${verification.trust_score || 'N/A'}% - Verified by VeriedIT AI`;
    const ogDescription = verification.result_summary 
      ? verification.result_summary.substring(0, 160)
      : 'This content has been verified using AI-powered fact-checking.';

    // Generate OG image
    let ogImageUrl = null;
    try {
      const ogImageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-og-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'verification',
          title: verification.content.substring(0, 100),
          trustScore: verification.trust_score,
          content: verification.result_summary || verification.content,
        }),
      });

      if (ogImageResponse.ok) {
        const ogData = await ogImageResponse.json();
        ogImageUrl = ogData.imageUrl;
        console.log('OG image generated:', ogImageUrl);
      }
    } catch (ogError) {
      console.error('Error generating OG image:', ogError);
      // Continue without OG image
    }

    // Create public share record
    const { data: publicShare, error: shareError } = await supabase
      .from('public_verifications')
      .insert({
        verification_id: verificationId,
        user_id: user.id,
        share_token: shareToken,
        expires_at: expiresAt,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image_url: ogImageUrl,
      })
      .select()
      .single();

    if (shareError) {
      console.error('Error creating share:', shareError);
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate shareable URL - use request origin for proper URL
    const origin = req.headers.get('origin') || 'https://veriedit-ai.lovable.app';
    const shareUrl = `${origin}/share/${shareToken}`;

    console.log('Share created successfully:', { shareToken, verificationId, shareUrl });

    return new Response(
      JSON.stringify({
        shareUrl,
        shareToken,
        expiresAt,
        viewCount: 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-public-share:', error);
    console.error('Error details:', { 
      message: error.message, 
      stack: error.stack,
      name: error.name 
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
