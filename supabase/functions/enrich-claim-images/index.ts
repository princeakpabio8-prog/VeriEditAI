import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🖼️ Starting claim image enrichment...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch claims without images (limit to 10 at a time)
    const { data: claims, error: fetchError } = await supabase
      .from('viral_claims')
      .select('id, claim_text, platform, engagement_score, rarity_tier')
      .is('image_url', null)
      .in('status', ['detected', 'trending', 'monitoring'])
      .order('engagement_score', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching claims:', fetchError);
      throw fetchError;
    }

    if (!claims || claims.length === 0) {
      console.log('✅ No claims need image enrichment');
      return new Response(
        JSON.stringify({ message: 'All claims have images', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${claims.length} claims without images`);

    let processed = 0;
    let failed = 0;

    // Process each claim
    for (const claim of claims) {
      try {
        console.log(`\n🎨 Generating image for claim ${claim.id}...`);
        
        // Call the generate-claim-image function
        const { data: imageData, error: imageError } = await supabase.functions.invoke(
          'generate-claim-image',
          {
            body: {
              claim_text: claim.claim_text,
              viral_claim_id: claim.id,
            }
          }
        );

        if (imageError) {
          console.error(`❌ Failed to generate image for ${claim.id}:`, imageError);
          failed++;
          continue;
        }

        if (imageData?.image_url) {
          console.log(`✅ Successfully enriched claim ${claim.id}`);
          processed++;
        } else {
          console.log(`⚠️ No image URL returned for ${claim.id}`);
          failed++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (claimError) {
        console.error(`❌ Error processing claim ${claim.id}:`, claimError);
        failed++;
      }
    }

    console.log(`\n📊 Enrichment complete: ${processed} processed, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: claims.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Enrichment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});