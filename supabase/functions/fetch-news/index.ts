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
    const { category = 'general', pageSize = 20 } = await req.json();
    const limit = String(pageSize);

    const cacheKey = `${category}-${limit}`;
    const cached = cache.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached news data for:', cacheKey);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get NewsAPI key from environment
    const newsApiKey = Deno.env.get('NEWSAPI_KEY');
    
    if (!newsApiKey) {
      throw new Error('NEWSAPI_KEY not configured');
    }
    
    // Map category names to NewsAPI categories
    const categoryMap: Record<string, string> = {
      'general': 'general',
      'technology': 'technology',
      'health': 'health',
      'business': 'business',
      'science': 'science',
      'sports': 'sports',
    };
    
    const mappedCategory = categoryMap[category] || 'general';

    // Fetch from NewsAPI
    const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${mappedCategory}&country=us&pageSize=${limit}&apiKey=${newsApiKey}`;
    
    console.log('Fetching news from NewsAPI:', mappedCategory);
    const response = await fetch(newsApiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI error:', errorText);
      throw new Error(`NewsAPI request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform NewsAPI response to match our expected format
    const articles = (data.articles || [])
      .filter((article: any) => article && article.title && article.title !== '[Removed]')
      .map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        source: { name: article.source?.name || 'Unknown' },
        publishedAt: article.publishedAt,
      }));

    const result = {
      articles,
      totalResults: data.totalResults || articles.length,
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
