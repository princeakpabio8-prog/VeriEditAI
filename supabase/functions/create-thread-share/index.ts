import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateThreadShareRequest {
  threadId: string;
  expiresIn?: number; // Days until expiration
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { threadId, expiresIn }: CreateThreadShareRequest = await req.json();
    console.log('Creating thread share for:', threadId);

    // Verify thread ownership
    const { data: thread, error: threadError } = await supabase
      .from('room_threads')
      .select(`
        id,
        title,
        content,
        trust_score,
        view_count,
        comment_count,
        upvote_count,
        author_id,
        profiles!room_threads_author_id_fkey (
          full_name
        )
      `)
      .eq('id', threadId)
      .eq('author_id', user.id)
      .single();

    if (threadError || !thread) {
      throw new Error('Thread not found or unauthorized');
    }

    // Check if active share already exists
    const { data: existingShare } = await supabase
      .from('public_threads')
      .select('*')
      .eq('thread_id', threadId)
      .eq('is_active', true)
      .maybeSingle();

    if (existingShare) {
      const shareUrl = `${supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '')}/thread/share/${existingShare.share_token}`;
      return new Response(
        JSON.stringify({ 
          shareUrl,
          shareToken: existingShare.share_token,
          message: 'Using existing share link'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique share token
    const shareToken = crypto.randomUUID();

    // Calculate expiration
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Generate OG image
    const authorName = thread.profiles?.full_name || 'Anonymous';
    
    const ogImageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-og-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: 'thread',
        title: thread.title,
        trustScore: thread.trust_score,
        content: thread.content,
        author: authorName,
        stats: {
          views: thread.view_count,
          comments: thread.comment_count,
          shares: thread.upvote_count
        }
      }),
    });

    let ogImageUrl = null;
    if (ogImageResponse.ok) {
      const ogData = await ogImageResponse.json();
      ogImageUrl = ogData.imageUrl;
    }

    // Create OG meta content
    const ogTitle = `${thread.title} | VeriedIT AI`;
    const ogDescription = thread.content.substring(0, 160) + (thread.content.length > 160 ? '...' : '');

    // Insert public share record
    const { data: shareData, error: shareError } = await supabase
      .from('public_threads')
      .insert({
        thread_id: threadId,
        user_id: user.id,
        share_token: shareToken,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image_url: ogImageUrl,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (shareError) {
      console.error('Error creating share:', shareError);
      throw shareError;
    }

    const shareUrl = `${req.headers.get('origin') || 'https://veried.it'}/thread/share/${shareToken}`;

    console.log('Thread share created:', shareUrl);

    return new Response(
      JSON.stringify({ 
        shareUrl,
        shareToken,
        ogImageUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-thread-share:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
