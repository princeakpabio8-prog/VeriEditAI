import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Parser from "https://esm.sh/rss-parser@3.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RSS Feed Sources
const RSS_SOURCES = [
  {
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    source_url: "https://www.bbc.com/news/world",
  },
  {
    name: "Reuters",
    url: "https://feeds.reuters.com/reuters/topNews",
    source_url: "https://www.reuters.com",
  },
  {
    name: "AP News",
    url: "https://apnews.com/apf-topnews?format=xml",
    source_url: "https://apnews.com",
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    source_url: "https://www.aljazeera.com",
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    source_url: "https://www.theguardian.com",
  },
  {
    name: "Punch NG",
    url: "https://punchng.com/feed/",
    source_url: "https://punchng.com",
  },
  {
    name: "Channels TV",
    url: "https://www.channelstv.com/feed/",
    source_url: "https://www.channelstv.com",
  },
];

// Categorization keywords
const CATEGORIES = {
  Politics: ["government", "election", "policy", "congress", "parliament", "politics", "minister", "president", "senate"],
  Technology: ["tech", "ai", "software", "digital", "innovation", "technology", "artificial intelligence", "computer", "internet"],
  Health: ["health", "medical", "vaccine", "disease", "hospital", "covid", "virus", "treatment", "doctor"],
  Business: ["business", "economy", "market", "finance", "trade", "stock", "investment", "company"],
  Science: ["science", "research", "study", "discovery", "climate", "environment", "nasa", "space"],
  Sports: ["sports", "football", "soccer", "cricket", "tournament", "championship", "league", "olympics"],
};

function categorizeArticle(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return "General";
}

async function fetchFeed(source: typeof RSS_SOURCES[0]) {
  const parser = new Parser({
    timeout: 10000,
    headers: {
      'User-Agent': 'VeriEdit-Lighthouse-Feed/1.0',
    },
  });

  try {
    const feed = await parser.parseURL(source.url);
    console.log(`Successfully fetched ${feed.items?.length || 0} items from ${source.name}`);
    
    return feed.items?.map(item => ({
      title: item.title || "Untitled",
      link: item.link || "",
      summary: item.contentSnippet || item.content || item.description || "",
      full_content: item.content || item.description || "",
      source: source.name,
      source_url: source.source_url,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      category: categorizeArticle(
        item.title || "",
        item.contentSnippet || item.description || ""
      ),
      metadata: {
        author: item.creator || item.author,
        guid: item.guid,
      },
    })) || [];
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error.message);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting RSS feed fetch...");
    
    // Fetch all sources in parallel
    const results = await Promise.allSettled(
      RSS_SOURCES.map(source => fetchFeed(source))
    );

    const articles = results
      .filter((result): result is PromiseFulfilledResult<any[]> => result.status === "fulfilled")
      .flatMap(result => result.value);

    console.log(`Total articles fetched: ${articles.length}`);

    // Insert articles into database (avoiding duplicates by link)
    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const article of articles) {
      if (!article.link) {
        skippedCount++;
        continue;
      }

      const { error } = await supabase
        .from("news_feed")
        .upsert(
          {
            title: article.title,
            link: article.link,
            summary: article.summary.substring(0, 1000), // Limit summary length
            full_content: article.full_content,
            source: article.source,
            source_url: article.source_url,
            category: article.category,
            published_at: article.published_at,
            metadata: article.metadata,
          },
          { onConflict: "link", ignoreDuplicates: true }
        );

      if (error) {
        if (!error.message.includes("duplicate")) {
          errors.push(`${article.source}: ${error.message}`);
        } else {
          skippedCount++;
        }
      } else {
        insertedCount++;
      }
    }

    const stats = {
      success: true,
      total_fetched: articles.length,
      inserted: insertedCount,
      skipped: skippedCount,
      sources_processed: RSS_SOURCES.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log("RSS fetch complete:", stats);

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in fetch-rss-news:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
