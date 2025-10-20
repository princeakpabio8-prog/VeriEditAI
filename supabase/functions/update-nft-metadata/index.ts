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

    console.log('🔄 Starting metadata update process...');

    // Get all badges
    const { data: badges, error: badgesError } = await supabase
      .from('nft_badges')
      .select('*')
      .order('minted_at', { ascending: false });

    if (badgesError) throw badgesError;

    if (!badges || badges.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No badges to update', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updated = 0;
    const results = [];

    for (const badge of badges) {
      try {
        console.log(`Processing badge #${badge.token_id}...`);

        // Get the current metadata file
        const fileName = badge.metadata_uri.split('/').pop();
        if (!fileName) {
          console.log(`⚠️ Could not extract filename from: ${badge.metadata_uri}`);
          continue;
        }

        // Download current metadata
        const { data: metadataFile, error: downloadError } = await supabase.storage
          .from('nft-metadata')
          .download(fileName);

        if (downloadError) {
          console.log(`⚠️ Could not download metadata: ${downloadError.message}`);
          continue;
        }

        // Parse metadata
        const metadataText = await metadataFile.text();
        const metadata = JSON.parse(metadataText);

        // Update image URL to use the default template (for now)
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/nft-badge-images/truth-badge-template.png`;
        
        const updatedMetadata = {
          ...metadata,
          image: imageUrl,
          // Add OpenSea-specific fields
          animation_url: null, // No animation for now
          background_color: "1a1f2e",
        };

        // Upload updated metadata
        const { error: uploadError } = await supabase.storage
          .from('nft-metadata')
          .update(fileName, JSON.stringify(updatedMetadata, null, 2), {
            contentType: 'application/json',
            upsert: true
          });

        if (uploadError) {
          console.log(`⚠️ Could not update metadata: ${uploadError.message}`);
          continue;
        }

        console.log(`✅ Updated badge #${badge.token_id}`);
        updated++;
        results.push({
          token_id: badge.token_id,
          status: 'updated',
          image_url: imageUrl
        });

      } catch (error: any) {
        console.error(`❌ Error processing badge #${badge.token_id}:`, error.message);
        results.push({
          token_id: badge.token_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log(`✅ Metadata update complete: ${updated}/${badges.length} badges updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updated} of ${badges.length} badges`,
        updated,
        total: badges.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Metadata update error:', error);
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
