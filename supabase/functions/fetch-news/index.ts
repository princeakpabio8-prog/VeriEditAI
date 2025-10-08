import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'general';
    const limit = url.searchParams.get('pageSize') || '20';

    const cacheKey = `${category}-${limit}`;
    const cached = cache.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached news data for:', cacheKey);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MediaStack API key (hardcoded for simplicity)
    const mediaStackKey = '0f3107e38a6eb82f8f2da365a704d4b2';
    
    // Map category names to MediaStack categories
    const categoryMap: Record<string, string> = {
      'general': 'general',
      'technology': 'technology',
      'health': 'health',
      'business': 'business',
      'science': 'science',
      'sports': 'sports',
    };
    
    const mappedCategory = categoryMap[category] || 'general';

    // Fetch from MediaStack API (using HTTP for free tier)
    const mediaStackUrl = `http://api.mediastack.com/v1/news?access_key=${mediaStackKey}&categories=${mappedCategory}&countries=us&languages=en&limit=${limit}`;
    
    console.log('Fetching news from MediaStack:', mappedCategory);
    const response = await fetch(mediaStackUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('MediaStack error:', errorText);
      throw new Error(`MediaStack request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform MediaStack response to match our expected format
    const articles = (data.data || [])
      .filter((article: any) => article && article.title)
      .map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.image, // MediaStack uses 'image' field
        source: { name: article.source || 'Unknown' },
        publishedAt: article.published_at, // MediaStack uses 'published_at'
      }));

    const result = {
      articles,
      totalResults: data.pagination?.total || articles.length,
      category: mappedCategory,
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        articles: [],
        totalResults: 0,
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
