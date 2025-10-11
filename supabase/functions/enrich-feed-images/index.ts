import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OGMetadata {
  image?: string;
  title?: string;
}

async function fetchOGImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrustSignalBot/1.0)',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract OG image or Twitter card image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      let imageUrl = ogImageMatch[1];
      
      // Handle relative URLs
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch OG image for ${url}:`, error.message);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🖼️ Starting image enrichment process...');

    // Get articles without images, prioritizing sources with worst coverage
    const { data: articlesWithoutImages, error: fetchError } = await supabase
      .from('news_feed')
      .select('id, link, source')
      .is('image_url', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!articlesWithoutImages || articlesWithoutImages.length === 0) {
      console.log('✅ No articles need image enrichment');
      return new Response(
        JSON.stringify({ 
          success: true, 
          enriched: 0,
          message: 'No articles need enrichment'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${articlesWithoutImages.length} articles without images`);

    // Group by source to see coverage
    const sourceCounts = articlesWithoutImages.reduce((acc, article) => {
      acc[article.source] = (acc[article.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Articles without images by source:', sourceCounts);

    let enrichedCount = 0;
    const batchSize = 10;
    const delayBetweenBatches = 500; // ms

    // Process in small batches
    for (let i = 0; i < articlesWithoutImages.length; i += batchSize) {
      const batch = articlesWithoutImages.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articlesWithoutImages.length / batchSize)} (${batch.length} articles)`);

      const enrichmentPromises = batch.map(async (article) => {
        try {
          const imageUrl = await fetchOGImage(article.link);
          
          if (imageUrl) {
            const { error: updateError } = await supabase
              .from('news_feed')
              .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
              .eq('id', article.id);

            if (!updateError) {
              console.log(`✅ Enriched: ${article.source}`);
              return true;
            } else {
              console.error(`❌ Update failed for ${article.id}:`, updateError.message);
            }
          }
          return false;
        } catch (error) {
          console.error(`❌ Error enriching ${article.id}:`, error.message);
          return false;
        }
      });

      const results = await Promise.all(enrichmentPromises);
      const batchEnriched = results.filter(Boolean).length;
      enrichedCount += batchEnriched;

      console.log(`✅ Batch complete: ${batchEnriched}/${batch.length} enriched`);

      // Delay between batches to avoid memory spikes
      if (i + batchSize < articlesWithoutImages.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`\n🎉 Image enrichment complete: ${enrichedCount}/${articlesWithoutImages.length} articles enriched`);

    return new Response(
      JSON.stringify({
        success: true,
        enriched: enrichedCount,
        total_processed: articlesWithoutImages.length,
        coverage_improvement: `${((enrichedCount / articlesWithoutImages.length) * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in enrich-feed-images:', error);
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
