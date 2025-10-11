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
    name: "CNN",
    url: "http://rss.cnn.com/rss/edition.rss",
    source_url: "https://www.cnn.com",
  },
  {
    name: "The New York Times",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    source_url: "https://www.nytimes.com",
  },
  {
    name: "NPR",
    url: "https://feeds.npr.org/1001/rss.xml",
    source_url: "https://www.npr.org",
  },
  {
    name: "The Economist",
    url: "https://www.economist.com/latest/rss.xml",
    source_url: "https://www.economist.com",
  },
  // Nigerian Fact-Checking Organizations
  {
    name: "Dubawa",
    url: "https://dubawa.org/feed/",
    source_url: "https://dubawa.org",
  },
  {
    name: "Africa Check Nigeria",
    url: "https://africacheck.org/feed",
    source_url: "https://africacheck.org",
  },
  {
    name: "Premium Times Centre for Investigative Journalism",
    url: "https://www.premiumtimesng.com/feed",
    source_url: "https://www.ptcij.org",
  },
  // Global Fact-Checking Organizations
  {
    name: "Full Fact",
    url: "https://fullfact.org/feed/",
    source_url: "https://fullfact.org",
  },
  {
    name: "Snopes",
    url: "https://www.snopes.com/feed/",
    source_url: "https://www.snopes.com",
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
  // Sports Sources
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/rss.xml",
    source_url: "https://www.bbc.com/sport",
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/espn/rss/news",
    source_url: "https://www.espn.com",
  },
  {
    name: "Sky Sports",
    url: "https://www.skysports.com/rss/12040",
    source_url: "https://www.skysports.com",
  },
  {
    name: "Complete Sports NG",
    url: "https://www.completesports.com/feed/",
    source_url: "https://www.completesports.com",
  },
  // Health Sources
  {
    name: "WHO News",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    source_url: "https://www.who.int",
  },
  {
    name: "Medical News Today",
    url: "https://www.medicalnewstoday.com/rss",
    source_url: "https://www.medicalnewstoday.com",
  },
  {
    name: "WebMD Health News",
    url: "https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",
    source_url: "https://www.webmd.com",
  },
  {
    name: "Reuters Health",
    url: "https://feeds.reuters.com/reuters/healthNews",
    source_url: "https://www.reuters.com/health",
  },
  // Business Sources
  {
    name: "Bloomberg",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    source_url: "https://www.bloomberg.com",
  },
  {
    name: "Reuters Business",
    url: "https://feeds.reuters.com/reuters/businessNews",
    source_url: "https://www.reuters.com/business",
  },
  {
    name: "Financial Times",
    url: "https://www.ft.com/?format=rss",
    source_url: "https://www.ft.com",
  },
  {
    name: "Business Day NG",
    url: "https://businessday.ng/feed/",
    source_url: "https://businessday.ng",
  },
  // Entertainment Sources
  {
    name: "BBC Entertainment & Arts",
    url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    source_url: "https://www.bbc.com/news/entertainment_and_arts",
  },
  {
    name: "Variety",
    url: "https://variety.com/feed/",
    source_url: "https://variety.com",
  },
  {
    name: "The Hollywood Reporter",
    url: "https://www.hollywoodreporter.com/feed/",
    source_url: "https://www.hollywoodreporter.com",
  },
  {
    name: "Entertainment Weekly",
    url: "https://ew.com/feed/",
    source_url: "https://ew.com",
  },
  {
    name: "Billboard",
    url: "https://www.billboard.com/feed/",
    source_url: "https://www.billboard.com",
  },
  {
    name: "Rolling Stone",
    url: "https://www.rollingstone.com/feed/",
    source_url: "https://www.rollingstone.com",
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
  Entertainment: ["entertainment", "movie", "film", "tv", "television", "music", "celebrity", "actor", "actress", "album", "concert", "grammy", "oscar", "emmy", "hollywood", "streaming", "netflix", "spotify", "billboard", "variety"],
};

function categorizeArticle(title: string, summary: string, source: string): string {
  // Define entertainment sources for priority categorization
  const entertainmentSources = [
    "BBC Entertainment & Arts",
    "Variety", 
    "The Hollywood Reporter",
    "Entertainment Weekly",
    "Billboard",
    "Rolling Stone"
  ];
  
  // Priority categorization by source
  if (entertainmentSources.includes(source)) {
    return "Entertainment";
  }
  
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return "General";
}

async function fetchFeed(source: typeof RSS_SOURCES[0], itemLimit = 25) {
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
    
    // Limit items to prevent memory overflow
    items = items.slice(0, itemLimit);
    
    console.log(`Parsing ${items.length} recent items from ${source.name}`);
    
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

      // Extract image URL from various RSS formats (native only, no OG fetching)
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

      if (!title || !link) {
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
        category: categorizeArticle(title, description, source.name),
        image_url: imageUrl,
        metadata: {
          author: author || null,
          guid: guid || null,
        },
      });
    }
    
    console.log(`✅ Extracted ${articles.length} valid articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`❌ Error fetching ${source.name}:`, error.message);
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

    console.log("🚀 Starting RSS feed fetch with batch processing...");
    console.log(`📊 Total sources: ${RSS_SOURCES.length}`);
    
    // Process sources in batches to avoid memory overflow
    const BATCH_SIZE = 6;
    const batches = [];
    for (let i = 0; i < RSS_SOURCES.length; i += BATCH_SIZE) {
      batches.push(RSS_SOURCES.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} sources each`);
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalFetched = 0;
    const errors: string[] = [];
    
    // Process each batch sequentially to control memory
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} sources)...`);
      
      // Fetch feeds in parallel within this batch
      const batchResults = await Promise.allSettled(
        batch.map(source => fetchFeed(source, 25))
      );
      
      const batchArticles = batchResults
        .filter((result): result is PromiseFulfilledResult<any[]> => result.status === "fulfilled")
        .flatMap(result => result.value);
      
      console.log(`📰 Batch ${batchIndex + 1} fetched ${batchArticles.length} articles`);
      totalFetched += batchArticles.length;
      
      // Insert this batch's articles immediately (stream to DB)
      let batchInserted = 0;
      let batchSkipped = 0;
      
      for (const article of batchArticles) {
        if (!article.link) {
          batchSkipped++;
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
            batchSkipped++;
          }
        } else {
          batchInserted++;
        }
      }
      
      totalInserted += batchInserted;
      totalSkipped += batchSkipped;
      
      console.log(`✅ Batch ${batchIndex + 1} complete: ${batchInserted} inserted, ${batchSkipped} skipped`);
      
      // Clear batch from memory
      batchArticles.length = 0;
    }

    const stats = {
      success: true,
      total_fetched: totalFetched,
      inserted: totalInserted,
      skipped: totalSkipped,
      sources_processed: RSS_SOURCES.length,
      batches_processed: batches.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log("\n🎉 RSS fetch complete:", stats);

    // Trigger image enrichment in the background (fire-and-forget)
    const enrichImages = async () => {
      try {
        console.log('🖼️ Triggering background image enrichment...');
        const enrichResponse = await supabase.functions.invoke('enrich-feed-images');
        if (enrichResponse.error) {
          console.error('❌ Image enrichment error:', enrichResponse.error);
        } else {
          console.log('✅ Image enrichment complete:', enrichResponse.data);
        }
      } catch (error) {
        console.error('❌ Failed to trigger image enrichment:', error);
      }
    };

    // Start enrichment but don't wait for it
    enrichImages();

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error in fetch-rss-news:", error);
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
