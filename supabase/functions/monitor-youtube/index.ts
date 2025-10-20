import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Popular news channels on YouTube
const NEWS_CHANNELS = [
  { id: 'UCupvZG-5ko_eiXAupbDfxWw', name: 'CNN' },
  { id: 'UCeY0bbntWzzVIaj2z3QigXg', name: 'NBC News' },
  { id: 'UCXIJgqnII2ZOINSWNOGFThA', name: 'Fox News' },
  { id: 'UCBi2mrWuNuyYy4gbM6fU18Q', name: 'ABC News' },
  { id: 'UC16niRr50-MSBwiO3YDb3RA', name: 'BBC News' },
  { id: 'UCaXkIU1QidjPwiAYu6GcHjg', name: 'MSNBC' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📺 Starting YouTube viral claims monitoring...');
    let totalClaims = 0;
    let newClaims = 0;

    for (const channel of NEWS_CHANNELS) {
      try {
        // YouTube RSS feed URL
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
        
        console.log(`Fetching RSS from ${channel.name}...`);
        const response = await fetch(rssUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${channel.name}: ${response.status}`);
          continue;
        }

        const xmlText = await response.text();
        
        // Parse XML manually (basic parsing)
        const entries = xmlText.split('<entry>').slice(1);
        
        for (const entry of entries.slice(0, 10)) { // Process latest 10 videos
          try {
            // Extract video data
            const titleMatch = entry.match(/<title>(.*?)<\/title>/);
            const linkMatch = entry.match(/<link rel="alternate" href="(.*?)"/);
            const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
            const viewsMatch = entry.match(/<media:statistics views="(\d+)"/);
            const likesMatch = entry.match(/<media:starRating count="(\d+)"/);
            
            if (!titleMatch || !linkMatch) continue;
            
            const title = titleMatch[1];
            const url = linkMatch[1];
            const publishedAt = publishedMatch ? new Date(publishedMatch[1]) : new Date();
            const views = viewsMatch ? parseInt(viewsMatch[1]) : 0;
            const likes = likesMatch ? parseInt(likesMatch[1]) : 0;
            
            // Calculate engagement (views + likes * 10)
            const engagementScore = views + (likes * 10);
            
            // Only track videos with significant engagement
            if (engagementScore < 10000) continue;
            
            totalClaims++;
            
            // Create content hash
            const contentHash = await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(title.toLowerCase().trim())
            );
            const hashArray = Array.from(new Uint8Array(contentHash));
            const claimHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Check if claim already exists
            const { data: existing } = await supabase
              .from('viral_claims')
              .select('id, engagement_score')
              .eq('claim_hash', claimHash)
              .maybeSingle();
            
            if (existing) {
              // Update engagement if increased
              if (engagementScore > existing.engagement_score) {
                await supabase
                  .from('viral_claims')
                  .update({
                    engagement_score: engagementScore,
                    peak_engagement: Math.max(engagementScore, existing.engagement_score),
                    last_checked_at: new Date().toISOString(),
                  })
                  .eq('id', existing.id);
                
                console.log(`Updated YouTube claim: ${title.substring(0, 50)}...`);
              }
            } else {
              // Create new viral claim
              const { error: insertError } = await supabase
                .from('viral_claims')
                .insert({
                  claim_text: title,
                  claim_hash: claimHash,
                  platform: 'youtube',
                  platform_category: 'news',
                  source_url: url,
                  author: channel.name,
                  engagement_score: engagementScore,
                  engagement_velocity: engagementScore / 24, // Assume 24hr window
                  first_seen_at: publishedAt.toISOString(),
                  status: 'monitoring',
                  metadata: {
                    views,
                    likes,
                    channel_id: channel.id,
                    channel_name: channel.name,
                  },
                  media_type: 'video',
                });
              
              if (!insertError) {
                newClaims++;
                console.log(`✅ New YouTube claim: ${title.substring(0, 50)}... (${engagementScore} engagement)`);
              }
            }
          } catch (entryError) {
            console.error('Error processing video entry:', entryError);
          }
        }
      } catch (channelError) {
        console.error(`Error monitoring ${channel.name}:`, channelError);
      }
    }

    const summary = {
      success: true,
      platform: 'youtube',
      total_processed: totalClaims,
      new_claims: newClaims,
      channels_monitored: NEWS_CHANNELS.length,
      timestamp: new Date().toISOString(),
    };

    console.log('📺 YouTube monitoring complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('YouTube monitoring error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
