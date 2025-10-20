import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Auto-fix: Checking for badges with token_id = 0...');

    // Get badges with token_id = 0
    const { data: brokenBadges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('id, verification_id, token_id')
      .eq('token_id', '0')
      .limit(50); // Process in batches

    if (fetchError) throw fetchError;

    if (!brokenBadges || brokenBadges.length === 0) {
      console.log('✅ No badges need fixing');
      return new Response(
        JSON.stringify({ success: true, message: 'No badges need fixing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${brokenBadges.length} badges to fix`);

    // Run fix-token-ids function
    const { data: fixData, error: fixError } = await supabase.functions.invoke('fix-token-ids');
    
    if (fixError) {
      console.error('Fix failed:', fixError);
    } else {
      console.log('✅ Token IDs fixed:', fixData);
    }

    // Run fix-nft-images to update metadata
    const { error: imgError } = await supabase.functions.invoke('fix-nft-images');
    if (imgError) {
      console.error('Image fix failed:', imgError);
    } else {
      console.log('✅ Images updated');
    }

    // Sync with OpenSea
    const { error: syncError } = await supabase.functions.invoke('sync-opensea-collection');
    if (syncError) {
      console.error('OpenSea sync failed:', syncError);
    } else {
      console.log('✅ OpenSea synced');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-fixed ${brokenBadges.length} badges`,
        fixed_count: brokenBadges.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Auto-fix error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
