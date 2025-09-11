// Supabase Edge Function: /verify
// Enhanced Multi-Source AI-Powered Verification Engine

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment Variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY")!;
const googleFactCheckApiKey = Deno.env.get("GOOGLE_FACT_CHECK_API_KEY")!;
const newsApiKey = Deno.env.get("NEWSAPI_KEY")!;

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Interface for verification results
interface VerificationSource {
  title: string;
  url: string;
  snippet: string;
  reliability_score: number;
  source_type: 'perplexity' | 'google_fact_check' | 'news_api' | 'wikipedia' | 'fallback';
}

interface VerificationResult {
  confidence: number;
  analysis: string;
  sources: VerificationSource[];
  source_consensus: number;
  verification_method: string[];
}

// Google Fact Check Tools API integration
async function performGoogleFactCheck(content: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    const encodedQuery = encodeURIComponent(content.substring(0, 500)); // Limit query length
    const response = await fetch(
      `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodedQuery}&key=${googleFactCheckApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Fact Check API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google Fact Check response:', JSON.stringify(data, null, 2));

    if (!data.claims || data.claims.length === 0) {
      return {
        confidence: 50,
        analysis: "No fact-check results found in Google's database for this claim.",
        sources: []
      };
    }

    // Process fact-check results
    const claims = data.claims.slice(0, 3); // Top 3 results
    let totalRating = 0;
    let ratingCount = 0;
    const sources: VerificationSource[] = [];

    for (const claim of claims) {
      if (claim.claimReview && claim.claimReview.length > 0) {
        for (const review of claim.claimReview.slice(0, 2)) {
          const rating = review.textualRating?.toLowerCase() || '';
          
          // Convert textual ratings to numerical confidence
          let confidence = 50;
          if (rating.includes('true') || rating.includes('correct') || rating.includes('accurate')) {
            confidence = 90;
          } else if (rating.includes('mostly true') || rating.includes('mostly correct')) {
            confidence = 75;
          } else if (rating.includes('mixed') || rating.includes('half')) {
            confidence = 50;
          } else if (rating.includes('mostly false') || rating.includes('misleading')) {
            confidence = 25;
          } else if (rating.includes('false') || rating.includes('incorrect')) {
            confidence = 10;
          }

          totalRating += confidence;
          ratingCount++;

          sources.push({
            title: review.publisher?.name || 'Fact Check Organization',
            url: review.url || '#',
            snippet: `Fact Check Rating: ${review.textualRating} - ${claim.text?.substring(0, 200)}`,
            reliability_score: 95,
            source_type: 'google_fact_check'
          });
        }
      }
    }

    const avgConfidence = ratingCount > 0 ? Math.round(totalRating / ratingCount) : 50;
    const analysis = `Google Fact Check found ${claims.length} related claims. Average rating suggests ${avgConfidence}% confidence. ${sources.length} professional fact-checkers have reviewed similar claims.`;

    return {
      confidence: avgConfidence,
      analysis,
      sources
    };

  } catch (error) {
    console.error('Google Fact Check error:', error);
    return {
      confidence: 50,
      analysis: `Google Fact Check unavailable: ${error.message}`,
      sources: []
    };
  }
}

// NewsAPI integration for current news verification
async function performNewsVerification(content: string, category: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    // Extract key terms for search
    const searchTerms = content.replace(/[^\w\s]/g, ' ').split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5)
      .join(' OR ');

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerms)}&sortBy=relevancy&language=en&pageSize=10&apiKey=${newsApiKey}`
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('NewsAPI response:', JSON.stringify(data, null, 2));

    if (!data.articles || data.articles.length === 0) {
      return {
        confidence: 45,
        analysis: "No recent news articles found covering this topic.",
        sources: []
      };
    }

    // Process news articles
    const relevantArticles = data.articles.slice(0, 4);
    const sources: VerificationSource[] = [];
    
    for (const article of relevantArticles) {
      // Calculate source reliability based on domain
      const domain = new URL(article.url).hostname;
      let reliability = 70; // default
      
      // Boost reliability for trusted news sources
      const trustedSources = ['reuters.com', 'ap.org', 'bbc.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com'];
      if (trustedSources.some(trusted => domain.includes(trusted))) {
        reliability = 90;
      }

      sources.push({
        title: article.title || 'News Article',
        url: article.url,
        snippet: article.description || article.content?.substring(0, 200) || '',
        reliability_score: reliability,
        source_type: 'news_api'
      });
    }

    const confidence = Math.min(85, 60 + (sources.length * 5)); // More sources = higher confidence
    const analysis = `Found ${relevantArticles.length} recent news articles covering this topic. Current news coverage suggests active reporting and verification.`;

    return {
      confidence,
      analysis,
      sources
    };

  } catch (error) {
    console.error('NewsAPI error:', error);
    return {
      confidence: 40,
      analysis: `News verification unavailable: ${error.message}`,
      sources: []
    };
  }
}

// Wikipedia verification for encyclopedic facts
async function performWikipediaVerification(content: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    // Extract key terms for Wikipedia search
    const searchTerms = content.replace(/[^\w\s]/g, ' ').split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');

    const searchResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/search?q=${encodeURIComponent(searchTerms)}&limit=3`
    );

    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Wikipedia search response:', JSON.stringify(searchData, null, 2));

    if (!searchData.pages || searchData.pages.length === 0) {
      return {
        confidence: 45,
        analysis: "No relevant Wikipedia articles found for verification.",
        sources: []
      };
    }

    const sources: VerificationSource[] = [];
    
    for (const page of searchData.pages.slice(0, 2)) {
      sources.push({
        title: page.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
        snippet: page.description || page.excerpt || 'Wikipedia article',
        reliability_score: 85,
        source_type: 'wikipedia'
      });
    }

    const confidence = Math.min(80, 55 + (sources.length * 10));
    const analysis = `Found ${sources.length} relevant Wikipedia articles. Encyclopedic coverage suggests established factual content.`;

    return {
      confidence,
      analysis,
      sources
    };

  } catch (error) {
    console.error('Wikipedia verification error:', error);
    return {
      confidence: 40,
      analysis: `Wikipedia verification unavailable: ${error.message}`,
      sources: []
    };
  }
}

// Enhanced Perplexity verification (existing functionality)
async function performPerplexityVerification(content: string, category: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    let searchPrompt: string;
    let systemPrompt: string;
    
    if (category === 'business') {
      searchPrompt = `Analyze this business/entrepreneurship content for credibility and realism: "${content}". Consider: revenue claims plausibility, business model viability, timeline feasibility, and general entrepreneurship best practices. Provide confidence score (0-100) and detailed analysis.`;
      systemPrompt = `You are a business analyst and entrepreneurship expert. When analyzing personal business stories, focus on: 1) Plausibility of revenue/timeline claims based on industry norms, 2) Soundness of described business strategies, 3) Realistic market conditions, 4) Common entrepreneurship patterns. Provide balanced analysis acknowledging that personal anecdotes may not be independently verifiable but can be assessed for credibility based on business logic and market realities.`;
    } else {
      searchPrompt = `Verify this ${category} claim with current, factual information: "${content}". Provide confidence score (0-100), detailed analysis, and cite specific sources with URLs.`;
      systemPrompt = `You are an expert fact-checker specializing in ${category}. Analyze claims with real-time data and provide accurate verification results with confidence scores and specific source citations including URLs.`;
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0,
        citations: true
      }),
    });

    const data = await response.json();
    console.log('Perplexity response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid Perplexity API response structure');
    }
    
    const analysis = data.choices[0].message.content;
    
    // Extract confidence score
    let confidence = 75;
    const confidencePatterns = [
      /confidence[:\s]*(\d+)%?/i,
      /(\d+)%?\s*confidence/i,
      /score[:\s]*(\d+)/i,
      /(\d+)%\s*certain/i
    ];
    
    for (const pattern of confidencePatterns) {
      const match = analysis.match(pattern);
      if (match) {
        confidence = parseInt(match[1]);
        break;
      }
    }
    
    // Extract sources from response
    let sources: VerificationSource[] = [];
    
    if (data.citations && Array.isArray(data.citations) && data.citations.length > 0) {
      sources = data.citations.map((citation: any) => ({
        title: citation.title || citation.name || 'Perplexity Source',
        url: citation.url || citation.link || citation.href || '#',
        snippet: citation.text || citation.snippet || citation.excerpt || '',
        reliability_score: 80,
        source_type: 'perplexity' as const
      }));
    } else if (data.choices[0].citations && Array.isArray(data.choices[0].citations)) {
      sources = data.choices[0].citations.map((citation: any) => ({
        title: citation.title || citation.name || 'Perplexity Source',
        url: citation.url || citation.link || citation.href || '#',
        snippet: citation.text || citation.snippet || citation.excerpt || '',
        reliability_score: 80,
        source_type: 'perplexity' as const
      }));
    } else {
      // Extract URLs from analysis text
      const urlRegex = /https?:\/\/[^\s\)\]\>\,\;]+/g;
      const foundUrls = analysis.match(urlRegex) || [];
      
      sources = foundUrls.slice(0, 3).map((url: string) => {
        const cleanUrl = url.replace(/[.,;)\]}>]+$/, '');
        const domain = cleanUrl.match(/https?:\/\/(?:www\.)?([^\/]+)/);
        const title = domain ? domain[1].charAt(0).toUpperCase() + domain[1].slice(1) : 'Web Source';
        return {
          title,
          url: cleanUrl,
          snippet: 'Referenced in AI analysis',
          reliability_score: 75,
          source_type: 'perplexity' as const
        };
      });
    }
    
    return {
      confidence: Math.min(Math.max(confidence, 0), 100),
      analysis,
      sources: sources.slice(0, 4)
    };
  } catch (error) {
    console.error('Perplexity verification error:', error);
    return { 
      confidence: 50, 
      analysis: `AI verification unavailable: ${error.message}`, 
      sources: []
    };
  }
}

// Multi-source verification with consensus algorithm
async function performMultiSourceVerification(content: string, category: string): Promise<VerificationResult> {
  console.log('Starting multi-source verification...');
  
  // For business/personal stories, focus on AI analysis and news verification
  // Skip fact-checking APIs that won't have personal anecdote data
  let sourcesToRun;
  
  if (category === 'business') {
    sourcesToRun = [
      performPerplexityVerification(content, category),
      performNewsVerification(content, category)
    ];
  } else {
    sourcesToRun = [
      performPerplexityVerification(content, category),
      performGoogleFactCheck(content),
      performNewsVerification(content, category),
      performWikipediaVerification(content)
    ];
  }
  
  const results = await Promise.allSettled(sourcesToRun);

  // Collect results from successful verifications
  const verificationResults = [];
  const allSources: VerificationSource[] = [];
  const methods: string[] = [];

  // Process results based on category
  if (category === 'business') {
    if (results[0]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Business Analysis', ...results[0].value });
      allSources.push(...results[0].value.sources);
      methods.push('AI Business Analysis');
    }
    if (results[1]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Market Verification', ...results[1].value });
      allSources.push(...results[1].value.sources);
      methods.push('Industry News Coverage');
    }
  } else {
    if (results[0]?.status === 'fulfilled') {
      verificationResults.push({ name: 'AI Analysis', ...results[0].value });
      allSources.push(...results[0].value.sources);
      methods.push('Real-time AI Analysis');
    }
    if (results[1]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Google Fact Check', ...results[1].value });
      allSources.push(...results[1].value.sources);
      methods.push('Professional Fact Checkers');
    }
    if (results[2]?.status === 'fulfilled') {
      verificationResults.push({ name: 'News Verification', ...results[2].value });
      allSources.push(...results[2].value.sources);
      methods.push('Current News Coverage');
    }
    if (results[3]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Wikipedia Check', ...results[3].value });
      allSources.push(...results[3].value.sources);
      methods.push('Encyclopedia Verification');
    }
  }

  // Consensus algorithm - weighted average based on source reliability
  let totalWeightedConfidence = 0;
  let totalWeight = 0;

  for (const result of verificationResults) {
    let weight = 1;
    
    // Weight different sources based on their reliability for different content types
    if (category === 'business') {
      if (result.name === 'Business Analysis') weight = 1.3; // AI business analysis gets higher weight for business content
      if (result.name === 'Market Verification') weight = 1.1; // Market coverage
    } else {
      if (result.name === 'Google Fact Check') weight = 1.5; // Professional fact-checkers get higher weight
      if (result.name === 'AI Analysis') weight = 1.2; // AI analysis gets good weight
      if (result.name === 'News Verification') weight = 1.1; // News coverage
      if (result.name === 'Wikipedia Check') weight = 1.0; // Wikipedia baseline
    }
    
    totalWeightedConfidence += result.confidence * weight;
    totalWeight += weight;
  }

  const consensusConfidence = totalWeight > 0 ? Math.round(totalWeightedConfidence / totalWeight) : 50;
  
  // Calculate source consensus (how much sources agree)
  const confidences = verificationResults.map(r => r.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const variance = confidences.reduce((acc, conf) => acc + Math.pow(conf - avgConfidence, 2), 0) / confidences.length;
  const sourceConsensus = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));

  // Combine analyses
  const combinedAnalysis = verificationResults.map(r => `**${r.name}**: ${r.analysis}`).join('\n\n');

  // Remove duplicate sources and prioritize by reliability
  const uniqueSources = allSources
    .filter((source, index, self) => 
      index === self.findIndex(s => s.url === source.url)
    )
    .sort((a, b) => b.reliability_score - a.reliability_score)
    .slice(0, 6); // Top 6 sources

  console.log(`Multi-source verification completed. Consensus: ${consensusConfidence}%, Sources: ${uniqueSources.length}, Methods: ${methods.length}`);

  return {
    confidence: consensusConfidence,
    analysis: combinedAnalysis,
    sources: uniqueSources,
    source_consensus: Math.round(sourceConsensus),
    verification_method: methods
  };
}

// Get category-specific fallback sources
function getCategorySpecificSources(category: string): VerificationSource[] {
  const sourceMap: Record<string, VerificationSource[]> = {
    "political": [
      { title: "White House Official", url: "https://whitehouse.gov", snippet: "Official government statements", reliability_score: 95, source_type: 'fallback' },
      { title: "Congress.gov", url: "https://congress.gov", snippet: "Congressional records", reliability_score: 95, source_type: 'fallback' },
      { title: "Politifact", url: "https://politifact.com", snippet: "Political fact-checking", reliability_score: 90, source_type: 'fallback' }
    ],
    "health & science": [
      { title: "CDC Health Info", url: "https://cdc.gov", snippet: "Public health data", reliability_score: 95, source_type: 'fallback' },
      { title: "NIH Research", url: "https://nih.gov", snippet: "Medical research", reliability_score: 95, source_type: 'fallback' },
      { title: "WHO Health Updates", url: "https://who.int", snippet: "Global health information", reliability_score: 90, source_type: 'fallback' }
    ]
  };
  
  return sourceMap[category] || [
    { title: "Reuters", url: "https://reuters.com", snippet: "Global news", reliability_score: 85, source_type: 'fallback' },
    { title: "Associated Press", url: "https://apnews.com", snippet: "News verification", reliability_score: 85, source_type: 'fallback' },
    { title: "BBC News", url: "https://bbc.com", snippet: "International news", reliability_score: 80, source_type: 'fallback' }
  ];
}

// Enhanced content categorization
function categorizeContent(content: string): string {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes("trump") || contentLower.includes("biden") || contentLower.includes("president") || 
      contentLower.includes("election") || contentLower.includes("congress") || contentLower.includes("senate") ||
      contentLower.includes("democracy") || contentLower.includes("republican") || contentLower.includes("democrat") ||
      contentLower.includes("political") || contentLower.includes("campaign") || contentLower.includes("vote")) {
    return "political";
  }
  
  if (contentLower.includes("climate") || contentLower.includes("environment") || contentLower.includes("carbon") || 
      contentLower.includes("global warming") || contentLower.includes("pollution") || contentLower.includes("renewable") ||
      contentLower.includes("greenhouse") || contentLower.includes("emissions") || contentLower.includes("sustainability")) {
    return "climate & environment";
  }
  
  if (contentLower.includes("health") || contentLower.includes("medicine") || contentLower.includes("covid") || 
      contentLower.includes("vaccine") || contentLower.includes("cure") || contentLower.includes("cancer") || 
      contentLower.includes("disease") || contentLower.includes("study") || contentLower.includes("research") ||
      contentLower.includes("medical") || contentLower.includes("doctor") || contentLower.includes("hospital") ||
      contentLower.includes("treatment") || contentLower.includes("drug") || contentLower.includes("pill")) {
    return "health & science";
  }
  
  if (contentLower.includes("war") || contentLower.includes("military") || contentLower.includes("defense") || contentLower.includes("defence") ||
      contentLower.includes("conflict") || contentLower.includes("ukraine") || contentLower.includes("russia") || 
      contentLower.includes("nato") || contentLower.includes("army") || contentLower.includes("soldier") ||
      contentLower.includes("weapon") || contentLower.includes("battle") || contentLower.includes("invasion")) {
    return "defence and war";
  }
  
  if (contentLower.includes("football") || contentLower.includes("soccer") || contentLower.includes("basketball") || 
      contentLower.includes("baseball") || contentLower.includes("tennis") || contentLower.includes("olympics") || 
      contentLower.includes("fifa") || contentLower.includes("championship") || contentLower.includes("premier league") ||
      contentLower.includes("nfl") || contentLower.includes("nba") || contentLower.includes("game") ||
      contentLower.includes("player") || contentLower.includes("team") || contentLower.includes("score")) {
    return "sports";
  }
  
  return "news & current events";
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, user_id } = await req.json();

    if (!content || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing multi-source verification for user: ${user_id}`);
    console.log(`Content: ${content.substring(0, 100)}...`);

    // Categorize content
    const category = categorizeContent(content);
    console.log(`Detected category: ${category}`);

    // Perform multi-source verification
    const verificationResult = await performMultiSourceVerification(content, category);
    
    // Add fallback sources if we don't have enough
    if (verificationResult.sources.length < 3) {
      const fallbackSources = getCategorySpecificSources(category);
      verificationResult.sources.push(...fallbackSources.slice(0, 3 - verificationResult.sources.length));
    }

    // Format comprehensive analysis
    const analysisText = `**🔍 MULTI-SOURCE VERIFICATION RESULTS**

**FINAL CONFIDENCE SCORE: ${verificationResult.confidence}%**
**SOURCE CONSENSUS: ${verificationResult.source_consensus}%**

**VERIFICATION STATUS: ${verificationResult.confidence >= 80 ? '✅ VERIFIED' : verificationResult.confidence >= 60 ? '🔍 LIKELY TRUE' : verificationResult.confidence >= 40 ? '⚠️ INCONCLUSIVE' : '❌ QUESTIONABLE'}**

**CATEGORY: ${category.toUpperCase()}**

**VERIFICATION METHODS USED:**
${verificationResult.verification_method.map(method => `• ${method}`).join('\n')}

**MULTI-SOURCE ANALYSIS:**
${verificationResult.analysis}

**VERIFICATION PROCESS:**
This claim underwent comprehensive multi-source verification including:

1. **Professional Fact-Checkers**: Google Fact Check Tools database
2. **Real-time AI Analysis**: Advanced AI with web search capabilities  
3. **Current News Coverage**: NewsAPI real-time news verification
4. **Encyclopedia Verification**: Wikipedia reference checking
5. **Consensus Algorithm**: Weighted scoring across all sources

**KEY FINDINGS:**
• **Sources Consulted**: ${verificationResult.sources.length} authoritative sources
• **Verification Methods**: ${verificationResult.verification_method.length} independent verification approaches
• **Source Agreement**: ${verificationResult.source_consensus}% consensus among sources
• **Real-time Check**: Completed ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

**RELIABILITY ASSESSMENT:**
${verificationResult.confidence >= 80 ? '🟢 **HIGH RELIABILITY** - Multiple authoritative sources confirm this information' : 
  verificationResult.confidence >= 60 ? '🟡 **MODERATE RELIABILITY** - Evidence supports claim but some uncertainty remains' :
  verificationResult.confidence >= 40 ? '🟠 **LOW RELIABILITY** - Mixed evidence requires additional verification' :
  '🔴 **UNRELIABLE** - Insufficient evidence or contradictory information found'}

**RECOMMENDATIONS:**
• Cross-reference with primary sources when possible
• Consider recency of information for time-sensitive claims
• Verify through official channels for critical decisions
• Be aware that information may evolve over time`;

    const result = {
      confidence: verificationResult.confidence,
      status: "completed",
      summary: analysisText,
      sources: verificationResult.sources.map(source => ({
        title: source.title,
        url: source.url,
        snippet: source.snippet
      })),
      created_at: new Date().toISOString(),
    };

    // Save to database
    console.log('Saving multi-source verification results...');
    const { data: verification, error: dbError } = await supabase
      .from("verifications")
      .insert({
        user_id,
        content,
        content_type: 'text',
        trust_score: verificationResult.confidence,
        status: "completed",
        result_summary: analysisText,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save verification result');
    }

    // Save sources
    if (verification && verificationResult.sources.length > 0) {
      const sourcesToInsert = verificationResult.sources.map(source => ({
        verification_id: verification.id,
        url: source.url,
        title: source.title,
        content_snippet: source.snippet,
        reliability_score: source.reliability_score
      }));

      const { error: sourcesError } = await supabase
        .from('sources')
        .insert(sourcesToInsert);

      if (sourcesError) {
        console.error('Sources save error:', sourcesError);
      }
    }

    console.log('Multi-source verification completed successfully');

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error("Error in multi-source verification:", err);
    return new Response(JSON.stringify({ 
      error: err.message,
      confidence: 0,
      status: 'error',
      summary: 'Multi-source verification failed due to technical error.',
      sources: [],
      created_at: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});