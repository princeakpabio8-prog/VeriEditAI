import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let recordsProcessed = 0;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Aggregate data by region, topic, and source
    const { data: verifications, error: verifyError } = await supabaseClient
      .from('verifications')
      .select(`
        id,
        trust_score,
        category,
        created_at,
        sources (
          domain,
          source_region,
          source_type,
          url
        )
      `)
      .gte('created_at', oneDayAgo.toISOString());

    if (verifyError) throw verifyError;

    // Group by region, topic, and domain
    const aggregatedData: Map<string, any> = new Map();

    verifications?.forEach((v: any) => {
      const topic = v.category || 'Uncategorized';
      const trustScore = v.trust_score || 50;
      
      v.sources?.forEach((source: any) => {
        const region = source.source_region || 'International';
        const domain = source.domain || 'Unknown';
        const key = `${region}|${topic}|${domain}`;

        if (!aggregatedData.has(key)) {
          aggregatedData.set(key, {
            region,
            topic,
            domain,
            source: source.url || domain,
            scores: [],
            count: 0
          });
        }

        const entry = aggregatedData.get(key);
        entry.scores.push(trustScore);
        entry.count++;
      });
    });

    // Calculate averages and week-over-week changes
    const analyticsRecords = [];
    
    for (const [key, data] of aggregatedData.entries()) {
      const avgScore = Math.round(
        data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length
      );

      // Get previous week data for comparison
      const { data: prevWeekData } = await supabaseClient
        .from('trust_analytics')
        .select('average_trust_score')
        .eq('region', data.region)
        .eq('topic', data.topic)
        .eq('domain', data.domain)
        .gte('created_at', fourteenDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      let weekOverWeekChange = 0;
      let trendingDirection = 'stable';
      
      if (prevWeekData && prevWeekData.length > 0) {
        const prevScore = prevWeekData[0].average_trust_score;
        weekOverWeekChange = Number((((avgScore - prevScore) / prevScore) * 100).toFixed(2));
        
        if (weekOverWeekChange > 5) trendingDirection = 'up';
        else if (weekOverWeekChange < -5) trendingDirection = 'down';
      }

      const credibilityTier = avgScore >= 75 ? 'high' : avgScore >= 50 ? 'medium' : 'low';

      analyticsRecords.push({
        source: data.source,
        domain: data.domain,
        region: data.region,
        topic: data.topic,
        average_trust_score: avgScore,
        verification_count: data.count,
        trending_direction: trendingDirection,
        week_over_week_change: weekOverWeekChange,
        credibility_tier: credibilityTier,
        analysis_period_start: oneDayAgo.toISOString(),
        analysis_period_end: now.toISOString(),
        metadata: {
          aggregation_run: now.toISOString(),
          source_count: data.scores.length
        }
      });
    }

    // Insert analytics records
    if (analyticsRecords.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('trust_analytics')
        .insert(analyticsRecords);

      if (insertError) throw insertError;
      recordsProcessed = analyticsRecords.length;
    }

    // Calculate global trust index
    const allScores = Array.from(aggregatedData.values())
      .flatMap((d: any) => d.scores);
    
    const globalTrustIndex = allScores.length > 0
      ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2))
      : 70;

    const highCredibilityCount = Array.from(aggregatedData.values())
      .filter((d: any) => {
        const avg = d.scores.reduce((a: number, b: number) => a + b, 0) / d.scores.length;
        return avg >= 75;
      }).length;

    const highCredibilityPercentage = aggregatedData.size > 0
      ? Number(((highCredibilityCount / aggregatedData.size) * 100).toFixed(2))
      : 0;

    // Find misinformation spike regions (regions with avg score < 50)
    const regionScores: Map<string, number[]> = new Map();
    aggregatedData.forEach((data: any) => {
      if (!regionScores.has(data.region)) {
        regionScores.set(data.region, []);
      }
      const avg = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
      regionScores.get(data.region)!.push(avg);
    });

    const misinformationSpikeRegions: string[] = [];
    regionScores.forEach((scores, region) => {
      const regionAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (regionAvg < 50) {
        misinformationSpikeRegions.push(region);
      }
    });

    // Find trending low topics
    const topicScores: Map<string, number[]> = new Map();
    aggregatedData.forEach((data: any) => {
      if (!topicScores.has(data.topic)) {
        topicScores.set(data.topic, []);
      }
      const avg = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
      topicScores.get(data.topic)!.push(avg);
    });

    const trendingLowTopics: string[] = [];
    topicScores.forEach((scores, topic) => {
      const topicAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (topicAvg < 60) {
        trendingLowTopics.push(topic);
      }
    });

    // Insert/update global snapshot
    const { error: snapshotError } = await supabaseClient
      .from('trust_index_snapshots')
      .upsert({
        snapshot_date: now.toISOString().split('T')[0],
        global_trust_index: globalTrustIndex,
        total_verifications: verifications?.length || 0,
        high_credibility_percentage: highCredibilityPercentage,
        misinformation_spike_regions: misinformationSpikeRegions,
        trending_low_topics: trendingLowTopics.slice(0, 10),
        metadata: {
          regions_analyzed: regionScores.size,
          topics_analyzed: topicScores.size,
          aggregation_timestamp: now.toISOString()
        }
      }, {
        onConflict: 'snapshot_date'
      });

    if (snapshotError) throw snapshotError;

    // Log successful execution
    const executionTime = Date.now() - startTime;
    await supabaseClient.from('aggregation_logs').insert({
      execution_status: 'success',
      records_processed: recordsProcessed,
      execution_time_ms: executionTime,
      metadata: {
        analytics_records: analyticsRecords.length,
        global_trust_index: globalTrustIndex,
        high_credibility_percentage: highCredibilityPercentage,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        records_created: analyticsRecords.length,
        global_trust_index: globalTrustIndex,
        high_credibility_percentage: highCredibilityPercentage,
        misinformation_spike_regions: misinformationSpikeRegions,
        trending_low_topics: trendingLowTopics,
        execution_time_ms: executionTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Aggregation error:', error);
    
    // Log failed execution
    const executionTime = Date.now() - startTime;
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseClient.from('aggregation_logs').insert({
        execution_status: 'failed',
        records_processed: recordsProcessed,
        execution_time_ms: executionTime,
        error_message: error.message,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});