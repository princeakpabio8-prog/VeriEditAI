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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get users who have digest enabled
    const { data: users } = await supabaseClient
      .from('profiles')
      .select('user_id, full_name, email:user_id(email)')
      .eq('activity_digest_enabled', true);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users to send digest' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get top activities from past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activities } = await supabaseClient
      .from('activity_stream')
      .select('*, view_count, share_count, click_count')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(10);

    // Send email digest to each user
    // This would integrate with Resend or another email service
    console.log(`Would send digest to ${users.length} users with ${activities?.length || 0} activities`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userCount: users.length,
        activityCount: activities?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-activity-digest:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
