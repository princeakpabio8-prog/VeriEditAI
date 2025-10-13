import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackShareRequest {
  shareToken: string;
  contentType: 'verification' | 'thread';
  platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'copy' | 'native';
  contentId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { shareToken, contentType, platform, contentId }: TrackShareRequest = await req.json();
    
    // Get user if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Get client info
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');
    const referrer = req.headers.get('referer');

    console.log('Tracking share:', { shareToken, contentType, platform });

    // Insert share analytics
    const { error: analyticsError } = await supabase
      .from('share_analytics')
      .insert({
        content_type: contentType,
        content_id: contentId || shareToken,
        share_token: shareToken,
        platform,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer,
      });

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
    }

    // Update share count and platform stats
    const tableName = contentType === 'verification' ? 'public_verifications' : 'public_threads';
    
    const { data: currentData } = await supabase
      .from(tableName)
      .select('share_count, platform_stats')
      .eq('share_token', shareToken)
      .single();

    if (currentData) {
      const platformStats = currentData.platform_stats || {};
      platformStats[platform] = (platformStats[platform] || 0) + 1;

      await supabase
        .from(tableName)
        .update({
          share_count: currentData.share_count + 1,
          platform_stats: platformStats,
          updated_at: new Date().toISOString(),
        })
        .eq('share_token', shareToken);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error tracking share:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
