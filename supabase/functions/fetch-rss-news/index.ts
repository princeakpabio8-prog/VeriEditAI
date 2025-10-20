import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.3.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Health Sources - Global Health Authorities & Research
  {
    name: "WHO News",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    source_url: "https://www.who.int",
  },
  {
    name: "CDC News",
    url: "https://tools.cdc.gov/api/v2/resources/media/403372.rss",
    source_url: "https://www.cdc.gov",
  },
  {
    name: "NIH News Releases",
    url: "https://www.nih.gov/news-events/news-releases/rss",
    source_url: "https://www.nih.gov",
  },
  {
    name: "Johns Hopkins Medicine",
    url: "https://www.hopkinsmedicine.org/news/articles.rss",
    source_url: "https://www.hopkinsmedicine.org",
  },
  {
    name: "The BMJ",
    url: "https://www.bmj.com/rss/recent.xml",
    source_url: "https://www.bmj.com",
  },
  // Health Sources - Medical News & Journalism
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
  {
    name: "HealthDay",
    url: "https://consumer.healthday.com/rss.xml",
    source_url: "https://consumer.healthday.com",
  },
  {
    name: "STAT News",
    url: "https://www.statnews.com/feed/",
    source_url: "https://www.statnews.com",
  },
  {
    name: "Kaiser Health News",
    url: "https://khn.org/feed/",
    source_url: "https://khn.org",
  },
  // Health Sources - Research & Academia
  {
    name: "Harvard Health Blog",
    url: "https://www.health.harvard.edu/blog/feed",
    source_url: "https://www.health.harvard.edu",
  },
  {
    name: "Nature Medicine",
    url: "https://www.nature.com/nm.rss",
    source_url: "https://www.nature.com/nm",
  },
  // Health Sources - Mental Health
  {
    name: "Psychology Today",
    url: "https://www.psychologytoday.com/us/front/feed",
    source_url: "https://www.psychologytoday.com",
  },
  {
    name: "Mental Health Foundation",
    url: "https://www.mentalhealth.org.uk/feed",
    source_url: "https://www.mentalhealth.org.uk",
  },
  // Health Sources - Global & Humanitarian
  {
    name: "Reliefweb Health",
    url: "https://reliefweb.int/updates?format=rss&filter[theme][0]=8072",
    source_url: "https://reliefweb.int",
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
  Health: ["health", "medical", "vaccine", "disease", "hospital", "covid", "virus", "treatment", "doctor", "mental health", "psychology", "wellbeing", "clinical trial", "peer review", "journal", "epidemic", "outbreak", "pandemic", "nutrition", "diet", "fitness", "surgery", "diagnosis", "symptom", "medicine", "pharmaceutical", "therapy", "patient", "healthcare"],
  Business: ["business", "economy", "market", "finance", "trade", "stock", "investment", "company"],
  Science: ["science", "research", "study", "discovery", "climate", "environment", "nasa", "space"],
  Sports: ["sports", "football", "soccer", "cricket", "tournament", "championship", "league", "olympics"],
  Entertainment: ["entertainment", "movie", "film", "tv", "television", "music", "celebrity", "actor", "actress", "album", "concert", "grammy", "oscar", "emmy", "hollywood", "streaming", "netflix", "spotify", "billboard", "variety"],
};

function categorizeArticle(title: string, summary: string, source: string): string {
  const entertainmentSources = [
    "BBC Entertainment & Arts",
    "Variety", 
    "The Hollywood Reporter",
    "Entertainment Weekly",
    "Billboard",
    "Rolling Stone"
  ];
  
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

// Utility to resolve relative URLs
function resolveUrl(baseUrl: string, rawUrl: string): string {
  if (!rawUrl) return '';
  
  // Already absolute
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl.replace(/^http:/, 'https:'); // Prefer https
  }
  
  // Protocol-relative
  if (rawUrl.startsWith('//')) {
    return `https:${rawUrl}`;
  }
  
  try {
    const base = new URL(baseUrl);
    
    // Absolute path
    if (rawUrl.startsWith('/')) {
      return `${base.protocol}//${base.host}${rawUrl}`;
    }
    
    // Relative path
    const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
    return `${base.protocol}//${base.host}${basePath}${rawUrl}`;
  } catch {
    return '';
  }
}

// Extract best image from media:thumbnail (handle array/object)
function getFromMediaThumbnail(item: any, baseUrl: string): string | null {
  const thumbnail = item["media:thumbnail"];
  if (!thumbnail) return null;
  
  if (Array.isArray(thumbnail)) {
    // Pick largest by width
    const best = thumbnail.reduce((prev: any, curr: any) => {
      const prevWidth = parseInt(prev["@_width"]) || 0;
      const currWidth = parseInt(curr["@_width"]) || 0;
      return currWidth > prevWidth ? curr : prev;
    }, thumbnail[0]);
    return resolveUrl(baseUrl, best["@_url"]);
  }
  
  return resolveUrl(baseUrl, thumbnail["@_url"]);
}

// Extract best image from media:content (prefer image/*, pick largest)
function getFromMediaContent(item: any, baseUrl: string): string | null {
  const content = item["media:content"];
  if (!content) return null;
  
  if (Array.isArray(content)) {
    const images = content.filter((c: any) => c["@_type"]?.startsWith("image/"));
    if (images.length === 0) return null;
    
    const best = images.reduce((prev: any, curr: any) => {
      const prevWidth = parseInt(prev["@_width"]) || 0;
      const currWidth = parseInt(curr["@_width"]) || 0;
      return currWidth > prevWidth ? curr : prev;
    }, images[0]);
    return resolveUrl(baseUrl, best["@_url"]);
  }
  
  if (content["@_type"]?.startsWith("image/")) {
    return resolveUrl(baseUrl, content["@_url"]);
  }
  
  return null;
}

// Extract from media:group (nested thumbnail/content)
function getFromMediaGroup(item: any, baseUrl: string): string | null {
  const group = item["media:group"];
  if (!group) return null;
  
  // Try thumbnail first
  let url = getFromMediaThumbnail(group, baseUrl);
  if (url) return url;
  
  // Try content
  return getFromMediaContent(group, baseUrl);
}

// Extract from enclosure (only if type is image/*)
function getFromEnclosure(item: any, baseUrl: string): string | null {
  const enclosure = item.enclosure;
  if (!enclosure) return null;
  
  if (Array.isArray(enclosure)) {
    const imageEnc = enclosure.find((e: any) => e["@_type"]?.startsWith("image/"));
    return imageEnc ? resolveUrl(baseUrl, imageEnc["@_url"]) : null;
  }
  
  if (enclosure["@_type"]?.startsWith("image/")) {
    return resolveUrl(baseUrl, enclosure["@_url"]);
  }
  
  return null;
}

// Extract video from enclosure (only if type is video/*)
function getVideoFromEnclosure(item: any, baseUrl: string): string | null {
  const enclosure = item.enclosure;
  if (!enclosure) return null;
  
  if (Array.isArray(enclosure)) {
    const videoEnc = enclosure.find((e: any) => e["@_type"]?.startsWith("video/"));
    return videoEnc ? resolveUrl(baseUrl, videoEnc["@_url"]) : null;
  }
  
  if (enclosure["@_type"]?.startsWith("video/")) {
    return resolveUrl(baseUrl, enclosure["@_url"]);
  }
  
  return null;
}

// Extract video from media:content
function getVideoFromMediaContent(item: any, baseUrl: string): string | null {
  const content = item["media:content"];
  if (!content) return null;
  
  if (Array.isArray(content)) {
    const videos = content.filter((c: any) => c["@_type"]?.startsWith("video/"));
    if (videos.length > 0) {
      return resolveUrl(baseUrl, videos[0]["@_url"]);
    }
  }
  
  if (content["@_type"]?.startsWith("video/")) {
    return resolveUrl(baseUrl, content["@_url"]);
  }
  
  return null;
}

// Extract from HTML content (support srcset, data-src, single quotes)
function getFromHtml(html: string, baseUrl: string): string | null {
  if (!html) return null;
  
  // Try srcset first (pick largest)
  const srcsetMatch = html.match(/srcset=["']([^"']+)["']/i);
  if (srcsetMatch) {
    const srcset = srcsetMatch[1].split(',').map(s => s.trim());
    const largest = srcset.reduce((prev, curr) => {
      const prevWidth = parseInt(prev.match(/\s(\d+)w/)?.[1] || '0');
      const currWidth = parseInt(curr.match(/\s(\d+)w/)?.[1] || '0');
      return currWidth > prevWidth ? curr : prev;
    }, srcset[0]);
    const url = largest.split(/\s/)[0];
    return resolveUrl(baseUrl, url);
  }
  
  // Try regular src with double quotes
  let imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
  if (imgMatch) return resolveUrl(baseUrl, imgMatch[1]);
  
  // Try single quotes
  imgMatch = html.match(/<img[^>]+src='([^'>]+)'/i);
  if (imgMatch) return resolveUrl(baseUrl, imgMatch[1]);
  
  // Try data-src (lazy loading)
  imgMatch = html.match(/<img[^>]+data-src="([^">]+)"/i);
  if (imgMatch) return resolveUrl(baseUrl, imgMatch[1]);
  
  return null;
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

      // Extract image URL with improved extraction (RSS only, OG enrichment happens later)
      let imageUrl = null;
      
      imageUrl = getFromMediaThumbnail(item, link) ||
                 getFromMediaContent(item, link) ||
                 getFromMediaGroup(item, link) ||
                 getFromEnclosure(item, link);

      // Extract video URL from enclosures
      let videoUrl = null;
      videoUrl = getVideoFromMediaContent(item, link) ||
                 getVideoFromEnclosure(item, link);
      
      // Check for image tag
      if (!imageUrl && (item.image?.url || item.image)) {
        imageUrl = resolveUrl(link, typeof item.image === "string" ? item.image : item.image.url);
      }
      
      // Extract from HTML content/description
      if (!imageUrl) {
        imageUrl = getFromHtml(content, link) || getFromHtml(description, link);
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
        video_url: videoUrl,
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

    console.log("🚀 Starting RSS feed fetch with batch processing and viral claim detection...");
    console.log(`📊 Total sources: ${RSS_SOURCES.length}`);
    
    const BATCH_SIZE = 6;
    const batches = [];
    for (let i = 0; i < RSS_SOURCES.length; i += BATCH_SIZE) {
      batches.push(RSS_SOURCES.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} sources each`);
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalFetched = 0;
    let viralClaims = 0;
    const errors: string[] = [];
    
    // Viral keywords for claim detection
    const viralKeywords = ['breaking', 'urgent', 'exclusive', 'bombshell', 'shocking', 'crisis', 'alert', 'unprecedented', 'emergency'];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} sources)...`);
      
      const batchResults = await Promise.allSettled(
        batch.map(source => fetchFeed(source, 25))
      );
      
      const batchArticles = batchResults
        .filter((result): result is PromiseFulfilledResult<any[]> => result.status === "fulfilled")
        .flatMap(result => result.value);
      
      console.log(`📰 Batch ${batchIndex + 1} fetched ${batchArticles.length} articles`);
      totalFetched += batchArticles.length;
      
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
          
          // Check if article is potentially viral
          const text = `${article.title} ${article.summary}`.toLowerCase();
          const hasViralKeyword = viralKeywords.some(keyword => text.includes(keyword));
          const isRecent = (new Date() - new Date(article.published_at)) < 24 * 60 * 60 * 1000; // Last 24 hours
          
          // Insert claims for any recent article to seed the feed
          if (isRecent) {
            try {
              // Create claim hash
              const hashBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(article.title.toLowerCase().trim())
              );
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const claimHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              // Insert viral claim
              const { error: viralError } = await supabase
                .from('viral_claims')
                .insert({
                  claim_text: article.title,
                  claim_hash: claimHash,
                  platform: 'news',
                  platform_category: 'news',
                  source_url: article.link,
                  author: article.source,
                  engagement_score: 1000, // Base score for RSS viral claims
                  engagement_velocity: 100,
                  first_seen_at: article.published_at,
                  status: 'monitoring',
                  metadata: {
                    description: article.summary.substring(0, 500),
                    feed_source: article.source,
                    category: article.category,
                    keywords: viralKeywords.filter(k => text.includes(k)),
                  },
                  media_type: article.image_url ? 'image' : 'text',
                })
                .onConflict('claim_hash')
                .ignoreDuplicates();
              
              if (!viralError) {
                viralClaims++;
                console.log(`🔥 Viral claim: ${article.title.substring(0, 50)}...`);
              }
            } catch (viralErr) {
              console.error('Error creating viral claim:', viralErr);
            }
          }
        }
      }
      
      totalInserted += batchInserted;
      totalSkipped += batchSkipped;
      
      console.log(`✅ Batch ${batchIndex + 1} complete: ${batchInserted} inserted, ${batchSkipped} skipped`);
      
      batchArticles.length = 0;
    }

    const stats = {
      success: true,
      total_fetched: totalFetched,
      inserted: totalInserted,
      skipped: totalSkipped,
      viral_claims_detected: viralClaims,
      sources_processed: RSS_SOURCES.length,
      batches_processed: batches.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log("\n🎉 RSS fetch complete:", stats);

    // Trigger image enrichment in the background
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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
