import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Starting monthly license reset...');

    // Reset all trial licenses that are 30+ days old since last reset
    const { data: resetLicenses, error: resetError } = await supabaseClient
      .from('licenses')
      .update({
        current_usage: 0,
        last_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('license_type', 'trial')
      .eq('status', 'active')
      .lte('last_reset_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select('user_id');

    if (resetError) {
      console.error('Error resetting licenses:', resetError);
      throw resetError;
    }

    const resetCount = resetLicenses?.length || 0;
    console.log(`Successfully reset ${resetCount} trial licenses`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset ${resetCount} trial licenses`,
        reset_count: resetCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in reset-monthly-licenses:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});