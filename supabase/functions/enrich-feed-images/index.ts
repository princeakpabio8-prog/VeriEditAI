import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Resolve relative URLs to absolute
function resolveUrl(baseUrl: string, rawUrl: string): string {
  if (!rawUrl) return '';
  
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl.replace(/^http:/, 'https:');
  }
  
  if (rawUrl.startsWith('//')) {
    return `https:${rawUrl}`;
  }
  
  try {
    const base = new URL(baseUrl);
    
    if (rawUrl.startsWith('/')) {
      return `${base.protocol}//${base.host}${rawUrl}`;
    }
    
    const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
    return `${base.protocol}//${base.host}${basePath}${rawUrl}`;
  } catch {
    return '';
  }
}

async function fetchPageImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrustSignalBot/1.0)',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // 1. Try OG/Twitter meta tags (multiple variants)
    const ogPatterns = [
      /<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i,
      /<meta\s+property=["']og:image:url["']\s+content=["']([^"']+)["']/i,
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+name=["']twitter:image:src["']\s+content=["']([^"']+)["']/i,
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    ];
    
    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return resolveUrl(url, match[1]);
      }
    }
    
    // 2. Try JSON-LD structured data
    const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        const extractImage = (obj: any): string | null => {
          if (!obj) return null;
          
          // Handle arrays
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const img = extractImage(item);
              if (img) return img;
            }
            return null;
          }
          
          // Handle image field
          if (obj.image) {
            if (typeof obj.image === 'string') {
              return resolveUrl(url, obj.image);
            }
            if (obj.image.url) {
              return resolveUrl(url, obj.image.url);
            }
            if (Array.isArray(obj.image)) {
              const firstImg = obj.image[0];
              if (typeof firstImg === 'string') {
                return resolveUrl(url, firstImg);
              }
              if (firstImg?.url) {
                return resolveUrl(url, firstImg.url);
              }
            }
          }
          
          return null;
        };
        
        const imageUrl = extractImage(jsonLd);
        if (imageUrl) return imageUrl;
      } catch {
        // JSON-LD parsing failed, continue
      }
    }
    
    // 3. Fallback: Parse largest <img> tag on page (hero images)
    const imgMatches = html.match(/<img[^>]+>/gi);
    if (imgMatches && imgMatches.length > 0) {
      // Find largest srcset or first img
      for (const imgTag of imgMatches) {
        // Try srcset first
        const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
        if (srcsetMatch) {
          const srcset = srcsetMatch[1].split(',').map(s => s.trim());
          const largest = srcset.reduce((prev, curr) => {
            const prevWidth = parseInt(prev.match(/\s(\d+)w/)?.[1] || '0');
            const currWidth = parseInt(curr.match(/\s(\d+)w/)?.[1] || '0');
            return currWidth > prevWidth ? curr : prev;
          }, srcset[0]);
          const imgUrl = largest.split(/\s/)[0];
          return resolveUrl(url, imgUrl);
        }
        
        // Try regular src
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const imgUrl = srcMatch[1];
          // Skip tiny images (icons, logos)
          if (!imgUrl.includes('icon') && !imgUrl.includes('logo') && !imgUrl.includes('avatar')) {
            return resolveUrl(url, imgUrl);
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch page image for ${url}:`, error.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🖼️ Starting image enrichment process...');

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

    const sourceCounts = articlesWithoutImages.reduce((acc, article) => {
      acc[article.source] = (acc[article.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Articles without images by source:', sourceCounts);

    let enrichedCount = 0;
    const batchSize = 10;
    const delayBetweenBatches = 500;

    for (let i = 0; i < articlesWithoutImages.length; i += batchSize) {
      const batch = articlesWithoutImages.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articlesWithoutImages.length / batchSize)} (${batch.length} articles)`);

      const enrichmentPromises = batch.map(async (article) => {
        try {
          const imageUrl = await fetchPageImage(article.link);
          
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