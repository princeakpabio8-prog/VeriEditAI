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

    console.log('🎨 Starting image backfill for viral claims...');

    // Get all claims without images
    const { data: claims, error } = await supabase
      .from('viral_claims')
      .select('id, claim_text, image_url')
      .is('image_url', null)
      .limit(20);

    if (error) throw error;

    if (!claims || claims.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No claims need images',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${claims.length} claims without images`);

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const claim of claims) {
      try {
        console.log(`🎨 Generating image for claim ${claim.id}...`);

        const { data, error: invokeError } = await supabase.functions.invoke('generate-claim-image', {
          body: {
            claim_text: claim.claim_text,
            viral_claim_id: claim.id
          }
        });

        if (invokeError) {
          console.error(`❌ Failed for claim ${claim.id}:`, invokeError);
          failed++;
          results.push({ id: claim.id, status: 'failed', error: invokeError.message });
        } else if (data?.success) {
          console.log(`✅ Generated image for claim ${claim.id}`);
          processed++;
          results.push({ id: claim.id, status: 'success', image_url: data.image_url });
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Error processing claim ${claim.id}:`, error);
        failed++;
        results.push({ id: claim.id, status: 'error', error: error.message });
      }
    }

    console.log(`✅ Backfill complete: ${processed} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        failed,
        total: claims.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Backfill error:', error);
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
