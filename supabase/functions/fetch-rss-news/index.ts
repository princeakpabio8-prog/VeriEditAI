import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.3.5";

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
  try {
    console.log(`Fetching ${source.name} from ${source.url}`);
    
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'VeriEdit-Lighthouse-Feed/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: true,
      trimValues: true,
    });
    
    const result = parser.parse(xmlText);
    
    let items = [];
    
    if (result.rss?.channel?.item) {
      items = Array.isArray(result.rss.channel.item) 
        ? result.rss.channel.item 
        : [result.rss.channel.item];
    } else if (result.feed?.entry) {
      items = Array.isArray(result.feed.entry) 
        ? result.feed.entry 
        : [result.feed.entry];
    }
    
    console.log(`Parsed ${items.length} items from ${source.name}`);
    
    const articles = [];
    
    for (const item of items) {
      const title = item.title?.["#text"] || item.title || "";
      
      let link = "";
      if (typeof item.link === "string") {
        link = item.link;
      } else if (item.link?.["@_href"]) {
        link = item.link["@_href"];
      } else if (Array.isArray(item.link)) {
        const htmlLink = item.link.find((l: any) => l["@_type"] === "text/html" || l["@_rel"] === "alternate");
        link = htmlLink?.["@_href"] || item.link[0]?.["@_href"] || "";
      }
      
      const description = item.description?.["#text"] || item.description || 
                         item.summary?.["#text"] || item.summary || 
                         item.content?.["#text"] || item.content || "";
      
      const content = item["content:encoded"]?.["#text"] || item["content:encoded"] ||
                     item.content?.["#text"] || item.content || 
                     description;
      
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      const author = item["dc:creator"] || item.creator || item.author?.name || item.author || "";
      const guid = item.guid?.["#text"] || item.guid || item.id || link;

      // Extract image URL from various RSS formats
      let imageUrl = null;
      
      // Check media:thumbnail
      if (item["media:thumbnail"]?.["@_url"]) {
        imageUrl = item["media:thumbnail"]["@_url"];
      }
      // Check media:content
      else if (item["media:content"]?.["@_url"]) {
        imageUrl = item["media:content"]["@_url"];
      }
      // Check enclosure (podcast/media attachments)
      else if (item.enclosure?.["@_url"] && item.enclosure?.["@_type"]?.startsWith("image")) {
        imageUrl = item.enclosure["@_url"];
      }
      // Check for image tag
      else if (item.image?.url || item.image) {
        imageUrl = typeof item.image === "string" ? item.image : item.image.url;
      }
      // Extract from content HTML (common in RSS feeds)
      else if (content) {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }
      // Extract from description HTML
      else if (description) {
        const imgMatch = description.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }
      
      // Try to fetch Open Graph image as fallback
      if (!imageUrl && link) {
        try {
          const pageResponse = await fetch(link, {
            headers: { 'User-Agent': 'VeriEdit-Lighthouse-Feed/1.0' },
            signal: AbortSignal.timeout(5000),
          });
          
          if (pageResponse.ok) {
            const html = await pageResponse.text();
            const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                                 html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
            if (ogImageMatch) {
              imageUrl = ogImageMatch[1];
            }
          }
        } catch (error) {
          console.log(`Could not fetch OG image for ${link}:`, error.message);
        }
      }

      if (!title || !link) {
        console.log(`Skipping item from ${source.name}: missing title or link`);
        continue;
      }

      articles.push({
        title: title.substring(0, 500),
        link: link,
        summary: description.substring(0, 1000),
        full_content: content,
        source: source.name,
        source_url: source.source_url,
        published_at: new Date(pubDate).toISOString(),
        category: categorizeArticle(title, description),
        image_url: imageUrl,
        metadata: {
          author: author || null,
          guid: guid || null,
        },
      });
    }
    
    console.log(`Extracted ${articles.length} valid articles from ${source.name}`);
    return articles;
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
            summary: article.summary.substring(0, 1000),
            full_content: article.full_content,
            source: article.source,
            source_url: article.source_url,
            category: article.category,
            published_at: article.published_at,
            image_url: article.image_url,
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
