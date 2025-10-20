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

    console.log('🔧 Fixing OpenSea URLs from /matic/ to /polygon/...');

    // Update all URLs that contain /matic/ to use /polygon/
    const { data: badges, error: fetchError } = await supabase
      .from('nft_badges')
      .select('id, opensea_url')
      .like('opensea_url', '%/matic/%');

    if (fetchError) throw fetchError;

    if (!badges || badges.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No URLs to fix - all already using correct format',
          fixed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${badges.length} badges with old URLs`);

    let fixed = 0;
    for (const badge of badges) {
      if (badge.opensea_url) {
        const newUrl = badge.opensea_url.replace('/matic/', '/polygon/');
        
        const { error: updateError } = await supabase
          .from('nft_badges')
          .update({ opensea_url: newUrl })
          .eq('id', badge.id);

        if (!updateError) {
          fixed++;
          console.log(`✅ Fixed badge ${badge.id}: ${newUrl}`);
        } else {
          console.error(`Failed to update badge ${badge.id}:`, updateError);
        }
      }
    }

    console.log(`✅ Fixed ${fixed} OpenSea URLs`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully updated ${fixed} OpenSea URLs from /matic/ to /polygon/`,
        fixed,
        total: badges.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
