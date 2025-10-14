import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Target subreddits for monitoring
const TARGET_SUBREDDITS = [
  'worldnews',
  'news',
  'politics',
  'nottheonion',
  'OutOfTheLoop',
  'bestof',
  'videos',
  'AskReddit'
];

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
  num_crossposts?: number;
  total_awards_received?: number;
}

async function fetchRedditPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=100`,
      {
        headers: {
          'User-Agent': 'VerifiedIt-Monitor/1.0 (Fact-checking platform)',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data.children.map((child: any) => child.data);
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

function generateClaimHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return Deno.env.get('DEPLOYMENT_ID') 
    ? btoa(normalized).slice(0, 32)
    : normalized.slice(0, 32); // Fallback for local dev
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting Reddit monitoring...');
    
    let totalProcessed = 0;
    let newClaims = 0;
    let updatedClaims = 0;

    // Fetch posts from all target subreddits
    for (const subreddit of TARGET_SUBREDDITS) {
      console.log(`📡 Fetching r/${subreddit}...`);
      const posts = await fetchRedditPosts(subreddit);
      
      for (const post of posts) {
        totalProcessed++;
        
        // Extract claim from title (and self text if available)
        const claimText = post.selftext 
          ? `${post.title} ${post.selftext}`.slice(0, 2000)
          : post.title;
        
        const claimHash = generateClaimHash(claimText);
        
        // Calculate total engagement
        const totalEngagement = post.score + 
          post.num_comments + 
          (post.num_crossposts || 0) * 2 + // Crossposts are strong signal
          (post.total_awards_received || 0) * 5; // Awards are premium engagement
        
        // Only track posts with significant engagement (500+)
        if (totalEngagement < 500) continue;

        // Check if claim already exists
        const { data: existingClaim } = await supabaseClient
          .from('viral_claims')
          .select('id, engagement_score, first_seen_at')
          .eq('claim_hash', claimHash)
          .eq('platform', 'reddit')
          .single();

        if (existingClaim) {
          // Update existing claim
          const timeDiff = (Date.now() - new Date(existingClaim.first_seen_at).getTime()) / (1000 * 60 * 60); // hours
          const engagementDiff = totalEngagement - existingClaim.engagement_score;
          const velocity = timeDiff > 0 ? engagementDiff / timeDiff : 0;

          await supabaseClient
            .from('viral_claims')
            .update({
              engagement_score: totalEngagement,
              engagement_velocity: velocity,
              peak_engagement: totalEngagement,
              last_checked_at: new Date().toISOString(),
              metadata: {
                subreddit,
                author: post.author,
                comments: post.num_comments,
                crossposts: post.num_crossposts || 0,
                awards: post.total_awards_received || 0,
                created_utc: post.created_utc,
              }
            })
            .eq('id', existingClaim.id);

          // Create engagement snapshot
          await supabaseClient
            .from('engagement_snapshots')
            .insert({
              viral_claim_id: existingClaim.id,
              score: post.score,
              comments: post.num_comments,
              shares: post.num_crossposts || 0,
              total_engagement: totalEngagement,
            });

          updatedClaims++;
        } else {
          // Create new viral claim
          const { data: newClaim } = await supabaseClient
            .from('viral_claims')
            .insert({
              claim_text: claimText,
              claim_hash: claimHash,
              platform: 'reddit',
              source_url: `https://reddit.com${post.permalink}`,
              author: post.author,
              engagement_score: totalEngagement,
              engagement_velocity: 0, // Initial velocity is 0
              peak_engagement: totalEngagement,
              status: 'monitoring',
              metadata: {
                subreddit,
                post_id: post.id,
                comments: post.num_comments,
                crossposts: post.num_crossposts || 0,
                awards: post.total_awards_received || 0,
                created_utc: post.created_utc,
              }
            })
            .select()
            .single();

          if (newClaim) {
            // Create initial engagement snapshot
            await supabaseClient
              .from('engagement_snapshots')
              .insert({
                viral_claim_id: newClaim.id,
                score: post.score,
                comments: post.num_comments,
                shares: post.num_crossposts || 0,
                total_engagement: totalEngagement,
              });

            newClaims++;
          }
        }
      }
      
      // Rate limiting - Reddit requests 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Reddit monitoring complete: ${totalProcessed} posts processed, ${newClaims} new claims, ${updatedClaims} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed,
        newClaims,
        updatedClaims,
        subreddits: TARGET_SUBREDDITS.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in monitor-reddit:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
