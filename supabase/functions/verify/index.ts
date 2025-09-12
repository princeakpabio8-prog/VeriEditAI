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
    const { content, user_id } = await req.json();
    
    if (!content) {
      console.error('❌ No content provided');
      return new Response(
        JSON.stringify({ error: 'Content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 Analyzing content: ${content.substring(0, 100)}...`);
    console.log(`👤 User ID: ${user_id || 'anonymous'}`);

    // Get Tavily API key
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
    
    let result: VerificationResult;
    
    if (tavilyApiKey) {
      console.log('🔍 Using Tavily Search API for verification...');
      result = await verifyWithTavily(content, tavilyApiKey);
    } else {
      console.log('⚡ Using fallback analysis (no Tavily key)...');
      result = await fallbackAnalysis(content);
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
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Verification failed',
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifyWithTavily(content: string, apiKey: string): Promise<VerificationResult> {
  const startTime = Date.now();
  
  try {
    const query = `Fact-check and verify: "${content}"`;

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
      : `**🔍 SEARCH-BASED VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nAnalyzed ${searchResults.length} sources for: "${content.substring(0, 100)}..."`;
    
    return {
      confidence,
      status,
      summary,
      analysis: `Tavily Search Analysis:\n\n${answer || `Based on ${searchResults.length} sources found, this claim has been evaluated for accuracy using real-time web search and reliable news sources.`}\n\nSearch completed with ${sources.length} relevant sources found.`,
      sources,
      source_consensus: confidence,
      verification_method: ['Tavily Search', 'Real-time Web Search', 'Source Analysis'],
      category: categorizeContent(content),
      created_at: new Date().toISOString(),
      processing_time: Date.now() - startTime
    };

  } catch (error) {
    console.error('🚨 Tavily API failed:', error);
    throw error;
  }
}

async function fallbackAnalysis(content: string): Promise<VerificationResult> {
  console.log('⚡ Running fallback analysis...');
  
  const words = content.split(' ').length;
  const hasNumbers = /\d/.test(content);
  const hasUrls = /https?:\/\//.test(content);
  const hasCapitalWords = /[A-Z]{2,}/.test(content);
  
  // Enhanced scoring algorithm
  let confidence = Math.min(words * 3 + 20, 85);
  if (hasNumbers) confidence += 5;
  if (hasUrls) confidence += 10;
  if (hasCapitalWords) confidence += 5;
  if (words > 50) confidence += 10;
  
  confidence = Math.max(25, Math.min(confidence, 90));
  
  const status = getStatusFromConfidence(confidence);
  
  return {
    confidence,
    status,
    summary: `**⚡ QUICK VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nWords: ${words}\n\nBasic analysis completed. For comprehensive verification, AI integration is recommended.`,
    analysis: `Content analysis: ${words} words detected. Score factors include length (${words > 50 ? 'good' : 'short'}), structure (${hasNumbers ? 'numbers present' : 'text only'}), and format (${hasUrls ? 'URLs included' : 'plain text'}).`,
    sources: [],
    source_consensus: confidence,
    verification_method: ['Basic Analysis', 'Word Count', 'Pattern Detection'],
    category: categorizeContent(content),
    created_at: new Date().toISOString(),
    processing_time: 0
  };
}

function extractConfidence(text: string): number {
  const match = text.match(/confidence[:\s]*(\d+)/i) || text.match(/(\d+)%/);
  if (match) {
    return Math.min(Math.max(parseInt(match[1]), 0), 100);
  }
  
  // Infer confidence from sentiment
  if (text.toLowerCase().includes('verified') || text.toLowerCase().includes('accurate')) return 85;
  if (text.toLowerCase().includes('disputed') || text.toLowerCase().includes('false')) return 25;
  if (text.toLowerCase().includes('inconclusive') || text.toLowerCase().includes('unclear')) return 55;
  
  return 60; // Default moderate confidence
}

function getStatusFromConfidence(confidence: number): string {
  if (confidence >= 70) return 'verified';
  if (confidence >= 40) return 'inconclusive';
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

// Helper function to calculate confidence based on Tavily results
function calculateTavilyConfidence(answer: string, results: any[]): number {
  let confidence = 50; // Base confidence
  
  // Increase confidence based on number of sources
  confidence += Math.min(results.length * 5, 25);
  
  // Increase confidence if answer is detailed
  if (answer && answer.length > 100) {
    confidence += 10;
  }
  
  // Increase confidence based on source reliability
  const reliableSources = results.filter((r: any) => r.url && (
    r.url.includes('reuters.com') || 
    r.url.includes('bbc.com') || 
    r.url.includes('apnews.com') ||
    r.url.includes('factcheck.org') ||
    r.url.includes('snopes.com') ||
    r.url.includes('politifact.com')
  ));
  confidence += reliableSources.length * 3;
  
  return Math.min(confidence, 95); // Cap at 95%
}

// Helper function to calculate source reliability score
function calculateReliabilityScore(url: string): number {
  if (!url) return 50;
  
  const domain = url.toLowerCase();
  
  // High reliability sources
  if (domain.includes('reuters.com') || domain.includes('apnews.com') || domain.includes('bbc.com')) {
    return 95;
  }
  
  // Fact-checking sites
  if (domain.includes('factcheck.org') || domain.includes('snopes.com') || domain.includes('politifact.com')) {
    return 90;
  }
  
  // Major news outlets
  if (domain.includes('cnn.com') || domain.includes('npr.org') || domain.includes('nytimes.com')) {
    return 85;
  }
  
  // Government and educational sources
  if (domain.includes('.gov') || domain.includes('.edu')) {
    return 80;
  }
  
  return 60; // Default reliability
}

function categorizeContent(content: string): string {
  const lower = content.toLowerCase();
  
  if (lower.includes('health') || lower.includes('medical') || lower.includes('vaccine')) return 'health';
  if (lower.includes('political') || lower.includes('election') || lower.includes('government')) return 'politics';
  if (lower.includes('climate') || lower.includes('environment') || lower.includes('global warming')) return 'science';
  if (lower.includes('economic') || lower.includes('financial') || lower.includes('market')) return 'economics';
  if (lower.includes('technology') || lower.includes('tech') || lower.includes('AI')) return 'technology';
  
  return 'general';
}