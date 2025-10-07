import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shareToken = url.searchParams.get('shareToken');

    if (!shareToken) {
      return new Response(
        JSON.stringify({ error: 'Missing shareToken parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the public verification record
    const { data: publicShare, error: shareError } = await supabase
      .from('public_verifications')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .maybeSingle();

    if (shareError || !publicShare) {
      console.error('Share not found:', shareError);
      return new Response(
        JSON.stringify({ error: 'Share not found or has been revoked' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share has expired
    if (publicShare.expires_at && new Date(publicShare.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This share link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the verification details
    const { data: verification, error: verificationError } = await supabase
      .from('verifications')
      .select('*')
      .eq('id', publicShare.verification_id)
      .single();

    if (verificationError || !verification) {
      console.error('Verification not found:', verificationError);
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('verification_id', verification.id);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
    }

    // Increment view count (do this asynchronously, don't wait for response)
    supabase
      .from('public_verifications')
      .update({ view_count: publicShare.view_count + 1 })
      .eq('id', publicShare.id)
      .then(() => console.log('View count incremented'))
      .catch(err => console.error('Error incrementing view count:', err));

    // Return sanitized data (no user PII)
    const response = {
      verification: {
        id: verification.id,
        content: verification.content,
        content_type: verification.content_type,
        trust_score: verification.trust_score,
        status: verification.status,
        result_summary: verification.result_summary,
        score_breakdown: verification.score_breakdown,
        processing_time_ms: verification.processing_time_ms,
        created_at: verification.created_at,
      },
      sources: sources || [],
      share: {
        view_count: publicShare.view_count + 1, // Include incremented count in response
        created_at: publicShare.created_at,
        og_title: publicShare.og_title,
        og_description: publicShare.og_description,
      },
    };

    console.log('Public verification fetched successfully:', { shareToken, verificationId: verification.id });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-public-verification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
