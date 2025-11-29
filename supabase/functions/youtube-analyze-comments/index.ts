import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl } = await req.json();
    
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!YOUTUBE_API_KEY || !OPENAI_API_KEY) {
      throw new Error('Required API keys not configured');
    }

    // Extract video ID from various YouTube URL formats
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }
    const videoId = videoIdMatch[1];
    console.log('Analyzing video:', videoId);

    // Fetch video metadata
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found');
    }

    const videoTitle = videoData.items[0].snippet.title;
    const commentCount = parseInt(videoData.items[0].statistics.commentCount || '0');
    console.log(`Video: "${videoTitle}", Comment count: ${commentCount}`);

    // Fetch comments (up to 5000)
    let allComments: string[] = [];
    let nextPageToken: string | null = null;
    const maxPages = 50; // 100 comments per page = 5000 max
    let pageCount = 0;

    do {
      const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const commentsResponse = await fetch(commentsUrl);
      const commentsData = await commentsResponse.json();
      
      if (commentsData.items) {
        const pageComments = commentsData.items.map((item: any) => 
          item.snippet.topLevelComment.snippet.textDisplay
        );
        allComments = allComments.concat(pageComments);
      }
      
      nextPageToken = commentsData.nextPageToken || null;
      pageCount++;
      
      if (pageCount >= maxPages) break;
    } while (nextPageToken);

    console.log(`Fetched ${allComments.length} comments`);

    if (allComments.length === 0) {
      throw new Error('No comments found on this video');
    }

    // Analyze with AI
    const analysisPrompt = `You are an intelligence analyst for YouTube comments. Analyze these ${allComments.length} comments from the video "${videoTitle}" and provide:

1. **Top 10 FAQs**: Extract the most frequently asked questions with their frequency count
2. **Comment Clusters**: Group comments into themes (Confusion, Praise, Complaints, Feature Requests, Questions, Off-topic, etc.) with 2-3 sample comments per cluster
3. **Sentiment Analysis**: Calculate percentages for Positive, Neutral, and Negative sentiment
4. **Insight Summary**: Write a 4-6 sentence intelligence brief summarizing key viewer sentiment and patterns
5. **Content Recommendations**: Based on audience questions and pain points, suggest 4-5 video topics/titles that would resonate with this audience

Comments to analyze:
${allComments.slice(0, 1000).join('\n---\n')}

Return ONLY valid JSON in this exact format:
{
  "faqs": [
    {"question": "...", "frequency": 15}
  ],
  "clusters": [
    {"theme": "...", "count": 50, "samples": ["...", "...", "..."]}
  ],
  "sentiment": {
    "positive": 45,
    "neutral": 35,
    "negative": 20
  },
  "summary": "...",
  "contentRecommendations": [
    {"title": "...", "reasoning": "...", "priority": "high"}
  ]
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a YouTube comment intelligence analyst. Always return valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, analysisText];
    const analysis = JSON.parse(jsonMatch[1]);

    return new Response(
      JSON.stringify({
        videoTitle,
        videoId,
        commentCount: allComments.length,
        totalComments: commentCount,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in youtube-analyze-comments:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
