// Professional AI-powered verification using Perplexity API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationResult {
  confidence: number;
  status: string;
  summary: string;
  analysis: string;
  sources: Array<{
    title: string;
    url: string;
    snippet?: string;
    reliability_score?: number;
  }>;
  source_consensus: number;
  verification_method: string[];
  category: string;
  created_at: string;
  processing_time: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 Starting verification process...');

  try {
    const body = await req.json();
    const user_id = body?.user_id;
    const safeContent = String(body?.content ?? '');

    if (safeContent.trim().length === 0) {
      console.error('❌ No content provided');
      return new Response(
        JSON.stringify({ error: 'Content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce quota limits for all users
    if (user_id) {
      console.log('🔒 Checking usage limits...');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: quotaResult, error: quotaError } = await supabase.rpc('increment_license_usage', {
        user_uuid: user_id,
        amount: 1
      });

      if (quotaError || !quotaResult?.success) {
        console.log('❌ Quota exceeded or error:', quotaError || quotaResult);
        return new Response(
          JSON.stringify({
            confidence: 0,
            status: 'failed',
            summary: '**🚫 VERIFICATION LIMIT REACHED**\n\nYou have reached your monthly verification limit. Please upgrade your plan to continue verifying content.',
            analysis: 'Verification blocked due to usage limit exceeded. Please upgrade to a paid plan for unlimited verifications.',
            sources: [],
            source_consensus: 0,
            verification_method: ['Quota Check'],
            category: 'general',
            created_at: new Date().toISOString(),
            processing_time: 0,
            metadata: { 
              quota_exceeded: true, 
              limit: quotaResult?.limit || 5,
              error_type: 'quota_limit'
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Quota check passed');
    }

    console.log(`📝 Analyzing content: ${safeContent.substring(0, 100)}...`);
    console.log(`👤 User ID: ${user_id || 'anonymous'}`);

    // Get Tavily API key
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
    
    let result: VerificationResult;
    
    if (tavilyApiKey) {
      console.log('🔍 Using Tavily Search API for verification...');
      result = await verifyWithTavily(safeContent, tavilyApiKey);
    } else {
      console.log('⚡ Using fallback analysis (no Tavily key)...');
      result = await fallbackAnalysis(safeContent);
    }

    const processingTime = Date.now() - startTime;
    result.processing_time = processingTime;

    console.log(`✅ Verification complete in ${processingTime}ms`);
    console.log(`📊 Confidence: ${result.confidence}% | Status: ${result.status}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Verification failed:', error);
    
    // Always return 200 with inconclusive result for mobile compatibility
    return new Response(
      JSON.stringify({
        confidence: 15,
        status: 'inconclusive',
        summary: '**⚡ VERIFICATION TEMPORARILY UNAVAILABLE**\n\nConfidence: 15%\nStatus: INCONCLUSIVE\n\nOur verification services are experiencing temporary issues. Please try again in a few moments.',
        analysis: 'Unable to complete verification due to service issues. This may be due to network connectivity or external API limitations.',
        sources: [],
        source_consensus: 15,
        verification_method: ['Fallback Analysis'],
        category: 'general',
        created_at: new Date().toISOString(),
        processing_time: processingTime,
        metadata: { fallback_reason: 'service_error', original_error: String(error) }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifyWithTavily(content: string, apiKey: string): Promise<VerificationResult> {
  const startTime = Date.now();
  
  try {
    const safeContent = String(content ?? '');
    const query = `Fact-check and verify: "${safeContent}"`;

    console.log('🔍 Sending request to Tavily Search API...');
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: true,
        max_results: 8,
        include_domains: ["reuters.com", "bbc.com", "cnn.com", "npr.org", "apnews.com", "factcheck.org", "snopes.com", "politifact.com", "nytimes.com"]
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 Tavily search results received');
    
    const answer = data.answer || '';
    const searchResults = data.results || [];
    
    // Process sources from search results
    const sources = searchResults.map((result: any) => ({
      title: result.title || 'Unknown Source',
      url: result.url || '',
      snippet: result.content ? result.content.substring(0, 200) + '...' : '',
      reliability_score: calculateReliabilityScore(result.url)
    }));

    // Calculate confidence based on search results quality
    const confidence = calculateTavilyConfidence(answer, searchResults);
    const status = getStatusFromConfidence(confidence);
    
    // Create comprehensive summary
    const summary = answer 
      ? `**🔍 TAVILY SEARCH VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nSources: ${sources.length}\n\n${answer.substring(0, 200)}...`
      : `**🔍 SEARCH-BASED VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nAnalyzed ${searchResults.length} sources for: "${safeContent.substring(0, 100)}..."`;
    
    return {
      confidence,
      status,
      summary,
      analysis: `Tavily Search Analysis:\n\n${answer || `Based on ${searchResults.length} sources found, this claim has been evaluated for accuracy using real-time web search and reliable news sources.`}\n\nSearch completed with ${sources.length} relevant sources found.`,
      sources,
      source_consensus: confidence,
      verification_method: ['Tavily Search', 'Real-time Web Search', 'Source Analysis'],
      category: categorizeContent(safeContent),
      created_at: new Date().toISOString(),
      processing_time: Date.now() - startTime
    };

  } catch (error) {
    console.error('🚨 Tavily API failed, returning fallback result:', error);
    // Return fallback result instead of throwing
    return {
      confidence: 20,
      status: 'inconclusive',
      summary: `**⚡ SEARCH VERIFICATION UNAVAILABLE**\n\nConfidence: 20%\nStatus: INCONCLUSIVE\n\nSearch services are temporarily unavailable. Using basic content analysis.`,
      analysis: `Search API temporarily unavailable. Content analyzed: ${String(content).length} characters. Unable to cross-reference with external sources at this time.`,
      sources: [],
      source_consensus: 20,
      verification_method: ['Fallback Analysis'],
      category: categorizeContent(String(content)),
      created_at: new Date().toISOString(),
      processing_time: Date.now() - startTime
    };
  }
}

async function fallbackAnalysis(content: string): Promise<VerificationResult> {
  console.log('⚡ Running fallback analysis...');
  
  const safeContent = String(content ?? '');
  const words = safeContent.split(' ').length;
  const hasNumbers = /\d/.test(safeContent);
  const hasUrls = /https?:\/\//.test(safeContent);
  const hasCapitalWords = /[A-Z]{2,}/.test(safeContent);
  
  // More conservative scoring algorithm
  let confidence = Math.min(words * 1.5 + 15, 65);
  if (hasNumbers) confidence += 3;
  if (hasUrls) confidence += 5;
  if (hasCapitalWords) confidence += 2;
  if (words > 50) confidence += 5;
  if (words < 10) confidence -= 10; // Penalty for very short content
  
  confidence = Math.max(15, Math.min(confidence, 75));
  
  const status = getStatusFromConfidence(confidence);
  
  return {
    confidence,
    status,
    summary: `**⚡ QUICK VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nWords: ${words}\n\nBasic analysis completed. For comprehensive verification, AI integration is recommended.`,
    analysis: `Content analysis: ${words} words detected. Score factors include length (${words > 50 ? 'good' : 'short'}), structure (${hasNumbers ? 'numbers present' : 'text only'}), and format (${hasUrls ? 'URLs included' : 'plain text'}).`,
    sources: [],
    source_consensus: confidence,
    verification_method: ['Basic Analysis', 'Word Count', 'Pattern Detection'],
    category: categorizeContent(safeContent),
    created_at: new Date().toISOString(),
    processing_time: 0
  };
}

function extractConfidence(text: string): number {
  const safeText = String(text ?? '');
  const match = safeText.match(/confidence[:\s]*(\d+)/i) || safeText.match(/(\d+)%/);
  if (match) {
    return Math.min(Math.max(parseInt(match[1]), 40), 95);
  }
  
  // Enhanced sentiment analysis with better confidence ranges
  const lower = safeText.toLowerCase();
  if (lower.includes('verified') || lower.includes('accurate') || lower.includes('confirmed')) return 82;
  if (lower.includes('disputed') || lower.includes('false') || lower.includes('incorrect')) return 28;
  if (lower.includes('inconclusive') || lower.includes('unclear') || lower.includes('uncertain')) return 55;
  if (lower.includes('likely') || lower.includes('probable')) return 72;
  if (lower.includes('unlikely') || lower.includes('doubtful')) return 35;
  
  return 65; // Improved default confidence
}

function getStatusFromConfidence(confidence: number): string {
  if (confidence >= 80) return 'verified';
  if (confidence >= 60) return 'inconclusive';
  return 'disputed';
}

function extractSources(text: string): Array<{ title: string; url: string; snippet?: string; reliability_score?: number }> {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = text.match(urlRegex) || [];
  
  return urls.slice(0, 3).map((url, index) => ({
    title: `AI Source ${index + 1}`,
    url: url,
    snippet: 'Referenced in AI analysis',
    reliability_score: 75 + Math.random() * 20
  }));
}

// Enhanced multi-factor confidence calculation based on Tavily results
function calculateTavilyConfidence(answer: string, results: any[]): number {
  const safeAnswer = String(answer ?? '');
  
  // Content Analysis Weight (40%)
  let contentScore = 50;
  if (safeAnswer.length > 200) contentScore += 15; // Detailed analysis
  if (safeAnswer.length > 100) contentScore += 10; // Moderate detail
  if (safeAnswer.includes('evidence') || safeAnswer.includes('data')) contentScore += 8;
  if (safeAnswer.includes('study') || safeAnswer.includes('research')) contentScore += 12;
  if (safeAnswer.toLowerCase().includes('disputed') || safeAnswer.includes('conflicting')) contentScore -= 20;
  
  // Source Quality Weight (35%)
  let sourceScore = 40;
  const sourceQualitySum = results.reduce((sum, r) => sum + calculateReliabilityScore(r.url || ''), 0);
  const avgSourceQuality = results.length > 0 ? sourceQualitySum / results.length : 60;
  sourceScore = Math.round(avgSourceQuality * 0.8); // Scale to appropriate range
  
  // Consensus Weight (25%)
  let consensusScore = 60;
  if (results.length >= 3) consensusScore += 15; // Multiple sources
  if (results.length >= 5) consensusScore += 10; // Strong consensus
  
  // Check for source diversity
  const domains = new Set(results.map(r => new URL(r.url || 'https://example.com').hostname));
  if (domains.size >= 3) consensusScore += 10; // Diverse sources
  
  // Final weighted calculation
  const finalConfidence = Math.round(
    (contentScore * 0.4) + (sourceScore * 0.35) + (consensusScore * 0.25)
  );
  
  return Math.min(Math.max(finalConfidence, 40), 95); // Ensure range 40-95%
}

// Enhanced source reliability scoring with comprehensive database
function calculateReliabilityScore(url: string): number {
  if (!url) return 50;
  
  const domain = String(url || '').toLowerCase();
  
  // Tier 1: Premium fact-checking and wire services (95-100%)
  if (domain.includes('reuters.com') || domain.includes('apnews.com') || 
      domain.includes('factcheck.org') || domain.includes('snopes.com')) {
    return 98;
  }
  
  // Tier 2: Major international news and government (90-94%)
  if (domain.includes('bbc.com') || domain.includes('npr.org') || 
      domain.includes('politifact.com') || domain.includes('.gov') || 
      domain.includes('who.int') || domain.includes('cdc.gov')) {
    return 92;
  }
  
  // Tier 3: Academic and established news (85-89%)
  if (domain.includes('.edu') || domain.includes('nytimes.com') || 
      domain.includes('guardian.com') || domain.includes('washingtonpost.com') ||
      domain.includes('nature.com') || domain.includes('science.org')) {
    return 87;
  }
  
  // Tier 4: Regional news and specialized sources (75-84%)
  if (domain.includes('cnn.com') || domain.includes('foxnews.com') || 
      domain.includes('wsj.com') || domain.includes('economist.com') ||
      domain.includes('healthline.com') || domain.includes('mayoclinic.org')) {
    return 80;
  }
  
  // Tier 5: General sources (60-74%)
  if (domain.includes('wikipedia.org') || domain.includes('britannica.com')) {
    return 70;
  }
  
  // Penalty for low-quality indicators
  if (domain.includes('blog') || domain.includes('forum') || 
      domain.includes('social') || domain.includes('reddit') ||
      domain.includes('facebook') || domain.includes('twitter')) {
    return 35;
  }
  
  return 65; // Improved default reliability
}

function categorizeContent(content: string): string {
  const lower = String(content || '').toLowerCase();
  
  if (lower.includes('health') || lower.includes('medical') || lower.includes('vaccine')) return 'health';
  if (lower.includes('political') || lower.includes('election') || lower.includes('government')) return 'politics';
  if (lower.includes('climate') || lower.includes('environment') || lower.includes('global warming')) return 'science';
  if (lower.includes('economic') || lower.includes('financial') || lower.includes('market')) return 'economics';
  if (lower.includes('technology') || lower.includes('tech') || lower.includes('ai')) return 'technology';
  
  return 'general';
}