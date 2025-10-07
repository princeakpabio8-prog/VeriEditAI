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
    const template = body?.template; // Template metadata from frontend

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
    if (template) {
      console.log(`🏷️ Template: ${template.name} (${template.industry})`);
      console.log(`🎯 Verification Focus: ${template.verificationFocus.join(', ')}`);
    }

    // Detect content type first
    const contentType = detectContentType(safeContent);
    console.log(`🎯 Content type detected: ${contentType}`);

    // Enhanced fraud detection for banking use cases
    // Increase sensitivity for bank templates
    const fraudAnalysis = detectFraudPatterns(safeContent, template?.industry === 'bank');
    if (fraudAnalysis.hasFraudIndicators) {
      console.log('⚠️ Fraud indicators detected:', fraudAnalysis.patterns);
    }

    let result: VerificationResult;
    
    if (contentType === 'fiction') {
      console.log('📚 Handling fictional content...');
      result = await handleFiction(safeContent);
    } else if (contentType === 'opinion') {
      console.log('💭 Handling opinion content...');
      result = await handleOpinion(safeContent);
    } else {
      // Factual verification
      const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
      
      if (tavilyApiKey) {
        console.log('🔍 Using Tavily Search API for verification...');
        result = await verifyWithTavily(safeContent, tavilyApiKey, template);
      } else {
        console.log('⚡ Using fallback analysis (no Tavily key)...');
        result = await fallbackAnalysis(safeContent);
      }
    }

    const processingTime = Date.now() - startTime;
    result.processing_time = processingTime;

    // Add fraud alert to result if detected
    if (fraudAnalysis.hasFraudIndicators) {
      (result as any).fraudAlert = {
        detected: true,
        patterns: fraudAnalysis.patterns,
        severity: fraudAnalysis.patterns.length >= 3 ? 'high' : fraudAnalysis.patterns.length >= 2 ? 'medium' : 'low'
      };
      
      // More prominent warning for bank templates
      const alertPrefix = template?.industry === 'bank' 
        ? '🚨 **CRITICAL FRAUD ALERT** 🚨' 
        : '⚠️ **FRAUD ALERT**';
      
      result.summary = `${result.summary}\n\n${alertPrefix}: ${fraudAnalysis.patterns.length} fraud indicator(s) detected: ${fraudAnalysis.patterns.join(', ')}`;
    }
    
    // Add template context to result
    if (template) {
      (result as any).templateContext = {
        name: template.name,
        industry: template.industry,
        verificationFocus: template.verificationFocus
      };
    }

    console.log(`✅ Verification complete in ${processingTime}ms`);
    console.log(`📊 Confidence: ${result.confidence}% | Status: ${result.status}`);
    if (fraudAnalysis.hasFraudIndicators) {
      console.log(`⚠️ Fraud Alert: ${fraudAnalysis.patterns.length} patterns detected`);
    }

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

// Enhanced fraud detection patterns for banks
function detectFraudPatterns(content: string, isBankTemplate = false): { hasFraudIndicators: boolean; patterns: string[] } {
  const lowerContent = content.toLowerCase();
  const fraudPatterns: string[] = [];
  
  // Financial fraud indicators
  const fraudKeywords = [
    'wire transfer urgently', 'send money now', 'verify your account immediately',
    'suspended account', 'unusual activity detected', 'confirm your password',
    'guaranteed return', 'risk-free investment', 'limited time offer',
    'inheritance windfall', 'lottery winner', 'tax refund pending',
    'bitcoin investment', 'cryptocurrency scheme', 'ponzi', 'pyramid scheme',
    'money laundering', 'offshore account', 'untraceable payment',
    'gift card payment', 'western union', 'urgent wire transfer'
  ];
  
  fraudKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      fraudPatterns.push(keyword);
    }
  });
  
  // Check for suspicious patterns
  if (/\d{16}/.test(content)) fraudPatterns.push('potential card number');
  if (/\d{3}-\d{2}-\d{4}/.test(content)) fraudPatterns.push('potential SSN');
  if (lowerContent.match(/click here|click this link|verify now/)) {
    fraudPatterns.push('phishing language');
  }
  
  // Additional checks for bank templates - more sensitive
  if (isBankTemplate) {
    if (lowerContent.includes('account') && lowerContent.includes('suspended')) {
      fraudPatterns.push('account suspension claim');
    }
    if (lowerContent.match(/urgent|immediately|asap|right now/)) {
      fraudPatterns.push('urgency tactics');
    }
  }
  
  return {
    hasFraudIndicators: fraudPatterns.length > 0,
    patterns: fraudPatterns
  };
}

function detectContentType(content: string): 'factual' | 'fiction' | 'opinion' {
  const lower = content.toLowerCase();
  
  // Fiction indicators - characters, stories, movies, games, books
  const fictionKeywords = [
    // Popular Franchises (Original + Extended)
    'harry potter', 'lord of the rings', 'game of thrones', 'avengers',
    'marvel', 'dc comics', 'star wars', 'pokemon', 'naruto', 'dragon ball',
    'batman', 'superman', 'spiderman', 'iron man', 'thor',
    'the witcher', 'breaking bad', 'stranger things',
    'sherlock holmes', 'james bond', 'indiana jones',
    'the hobbit', 'hunger games', 'twilight', 'divergent',
    'transformers', 'jurassic park', 'avatar', 'matrix',
    'disney', 'pixar',
    
    // Fantasy & Sci-Fi Indicators
    'wizard', 'witch', 'magic spell', 'dragon', 'elf', 'dwarf',
    'alien', 'spaceship', 'lightsaber', 'time travel',
    'parallel universe', 'multiverse', 'teleport', 'prophecy', 'quest',
    
    // Literary & Storytelling Terms
    'chapter', 'plot', 'storyline', 'narrator', 'author wrote',
    'fantasy world', 'fictional world', 'made-up', 'imaginary',
    'once upon a time', 'the end', 'sequel', 'prequel', 'fanfiction', 'comic book',
    
    // Media Type Indicators
    'in the movie', 'in the book', 'in the show', 'in the series', 'in the game',
    'character from', 'fictional character', 'story', 'novel', 'film',
    
    // Character Types
    'superhero', 'villain', 'protagonist', 'animated', 'anime', 'manga',
    
    // Video Game Specific
    'minecraft', 'fortnite', 'call of duty', 'league of legends',
    'world of warcraft', 'zelda', 'mario', 'sonic', 'gameplay', 'player character',
    
    // Nigerian/African Fiction Context
    'nollywood movie', 'nollywood', 'yoruba movie', 'igbo folklore',
    'anansi stories', 'african folktale', 'village story', 'juju magic',
    'mami water', 'spirit world',
    
    // General Fiction Phrases
    'in the story', 'based on the book', 'adaptation of',
    'fictional account', 'creative work'
  ];
  
  // Opinion indicators - subjective statements
  const opinionKeywords = [
    'i think', 'i believe', 'in my opinion', 'i feel',
    'best', 'worst', 'better than', 'should', 'must',
    'favorite', 'prefer', 'like', 'hate', 'love'
  ];
  
  if (fictionKeywords.some(kw => lower.includes(kw))) return 'fiction';
  if (opinionKeywords.some(kw => lower.includes(kw))) return 'opinion';
  
  return 'factual';
}

async function handleFiction(content: string): Promise<VerificationResult> {
  console.log('📚 Processing fictional content...');
  
  return {
    confidence: 95,
    status: 'verified',
    summary: `**📚 FICTIONAL CONTENT DETECTED**\n\nConfidence: 95%\nStatus: VERIFIED\n\nThis appears to be about fictional content (books, movies, games, etc.). Fiction is neither true nor false - it's creative storytelling.\n\nContent: "${content.substring(0, 150)}..."`,
    analysis: 'This content references fictional works or creative storytelling. Fiction is a form of artistic expression and is not subject to factual verification. Characters, events, and worlds in fiction are part of imaginative narratives.',
    sources: [],
    source_consensus: 95,
    verification_method: ['Fiction Detection'],
    category: 'fiction',
    created_at: new Date().toISOString(),
    processing_time: 0
  };
}

async function handleOpinion(content: string): Promise<VerificationResult> {
  console.log('💭 Processing opinion content...');
  
  return {
    confidence: 50,
    status: 'inconclusive',
    summary: `**💭 OPINION DETECTED**\n\nConfidence: 50%\nStatus: INCONCLUSIVE\n\nThis appears to be a subjective opinion or personal belief. Opinions cannot be fact-checked as true or false.\n\nContent: "${content.substring(0, 150)}..."`,
    analysis: 'This content expresses a personal opinion or subjective judgment, which is not subject to objective verification. Opinions are personal viewpoints that may vary from person to person and are neither factually true nor false.',
    sources: [],
    source_consensus: 50,
    verification_method: ['Opinion Detection'],
    category: 'opinion',
    created_at: new Date().toISOString(),
    processing_time: 0
  };
}

async function verifyWithTavily(content: string, apiKey: string, template?: any): Promise<VerificationResult> {
  const startTime = Date.now();
  
  try {
    const safeContent = String(content ?? '');
    
    // Customize query based on template - Make it highly specific to avoid generic responses
    let query = `Analyze this specific claim in detail with evidence: "${safeContent}". Provide: 1) What exactly is being claimed, 2) Evidence for/against with sources, 3) Final verdict with reasoning. Be specific to THIS claim, not general information about fact-checking.`;
    if (template) {
      const focusAreas = template.verificationFocus?.join(', ') || '';
      query = `${template.industry === 'bank' ? 'Financial fraud detection' : 'NGO fact-checking'}: Analyze this specific claim focusing on ${focusAreas}. Content: "${safeContent}". Provide detailed evidence, not generic information.`;
    }

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
    
    // Detect and filter generic responses
    const isGenericResponse = (
      answer.includes('fact-check organizations') ||
      answer.includes('refer to their official websites') ||
      answer.includes('For specific details') ||
      answer.length < 100
    );
    
    if (isGenericResponse) {
      console.warn('⚠️ Generic response detected from Tavily. Attempting fallback analysis.');
      return {
        confidence: 20,
        status: 'inconclusive',
        summary: `**⚡ VERIFICATION INCOMPLETE**\n\nConfidence: 20%\nStatus: INCONCLUSIVE\n\nThe search returned generic information instead of analyzing your specific content. This often happens when the claim cannot be verified through available sources.`,
        analysis: 'Unable to obtain specific verification for this content. Search services returned generic information.',
        sources: [],
        source_consensus: 20,
        verification_method: ['Generic Response Detected'],
        category: categorizeContent(safeContent),
        created_at: new Date().toISOString(),
        processing_time: Date.now() - startTime
      };
    }
    
    // Process sources from search results with full content
    const sources = searchResults.map((result: any) => ({
      title: result.title || 'Unknown Source',
      url: result.url || '',
      content_snippet: result.content ? result.content.substring(0, 200) + '...' : '',
      full_content: result.content || '',
      reliability_score: calculateReliabilityScore(result.url)
    }));

    // Calculate confidence based on search results quality
    let confidence = calculateTavilyConfidence(answer, searchResults, content);
    
    // Double-check for refutation in the answer itself
    const lowerAnswer = answer.toLowerCase();
    const lowerContent = content.toLowerCase();
    const contentKeywords = content.split(/\s+/).filter(w => w.length > 3).map(w => w.toLowerCase());
    const negationInAnswer = ['not', 'no', 'false', 'incorrect', 'untrue', 'wrong', 'actually', 'in reality'].some(neg => lowerAnswer.includes(neg));
    const keywordsInAnswer = contentKeywords.filter(word => lowerAnswer.includes(word)).length;
    
    const isRefuted = negationInAnswer && keywordsInAnswer >= 2;
    
    if (isRefuted) {
      // The answer is clearly refuting the claim - force low confidence and FALSE status
      confidence = Math.min(confidence, 30);
      console.log(`🚨 REFUTATION CONFIRMED: Answer refutes the claim. Capping confidence at 30%.`);
    }
    
    let status = getStatusFromConfidence(confidence);
    
    // Force FALSE status if refuted
    if (isRefuted && confidence < 40) {
      status = 'false';
    }
    
    // Create comprehensive summary with full answer (no truncation)
    let summary = answer 
      ? `**🔍 TAVILY SEARCH VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nSources: ${sources.length}\n\n${answer}`
      : `**🔍 SEARCH-BASED VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase()}\nAnalyzed ${searchResults.length} sources for: "${safeContent.substring(0, 100)}..."`;
    
    // Prepend refutation warning if detected
    if (isRefuted) {
      summary = `⚠️ **Refutation detected: The claim appears to be false.**\n\n${summary}`;
    }
    
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
  
  return {
    confidence: 50,
    status: 'inconclusive',
    summary: `**⚡ VERIFICATION UNAVAILABLE**\n\nConfidence: 50%\nStatus: INCONCLUSIVE\n\nUnable to verify: Network or API unavailable. Verification requires external sources.`,
    analysis: 'Verification requires external sources to fact-check content. Please try again when connected or when services are available.',
    sources: [],
    source_consensus: 50,
    verification_method: ['Unavailable - Offline'],
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
  if (confidence >= 70) return 'likely_accurate';
  if (confidence >= 55) return 'inconclusive';
  if (confidence >= 40) return 'disputed';
  return 'false';
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

// Enhanced multi-factor confidence calculation with fact category bonuses
// Returns both the confidence score and detailed breakdown
function calculateTavilyConfidence(answer: string, results: any[], originalContent: string = ''): number {
  const safeAnswer = String(answer ?? '');
  const safeContent = String(originalContent ?? '').toLowerCase();
  
  // Detect fact type for scoring adjustments
  const factType = detectFactType(safeContent, safeAnswer);
  const isEstablishedFact = factType === 'established-fact';
  
  console.log(`🎯 Fact type detected: ${factType}${isEstablishedFact ? ' (applying universal fact bonuses)' : ''}`);
  
  // Content Analysis Weight (30%) - Evidence-based scoring
  let contentScore = isEstablishedFact ? 60 : 50; // Start higher for established facts
  
  // NEGATION DETECTION - Check if answer contradicts the claim
  const lowerAnswer = safeAnswer.toLowerCase();
  const contentWords = safeContent.split(/\s+/).filter(w => w.length > 3).map(w => w.toLowerCase());
  
  // Negation words that indicate the claim is false
  const negationWords = ['not', 'no', 'false', 'incorrect', 'untrue', 'wrong', 'actually', 'in reality', 'myth', 'misconception', 'debunked'];
  const hasNegation = negationWords.some(neg => lowerAnswer.includes(neg));
  
  // Check if answer contains original claim keywords + negation
  const claimKeywordsInAnswer = contentWords.filter(word => lowerAnswer.includes(word)).length;
  
  let isDebunking = false;
  if (hasNegation && claimKeywordsInAnswer >= 2) {
    // Answer is DEBUNKING the claim - major penalty
    contentScore -= 60;
    isDebunking = true;
    console.log('🚨 CONTRADICTION DETECTED: Answer contradicts the original claim');
  }
  
  // Evidence quality indicators (not keyword gaming)
  const hasSpecificDates = /\b(19|20)\d{2}\b/.test(safeAnswer);
  const hasSpecificNames = /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/.test(safeAnswer);
  const hasNumbers = /\d+/.test(safeAnswer);
  const hasCitations = safeAnswer.includes('[') || safeAnswer.includes('according to');
  
  if (hasSpecificDates) contentScore += 12;
  if (hasSpecificNames) contentScore += 10;
  if (hasNumbers && safeAnswer.length > 100) contentScore += 8;
  if (hasCitations) contentScore += 15;
  if (safeAnswer.includes('evidence') || safeAnswer.includes('data')) contentScore += 10;
  if (safeAnswer.includes('study') || safeAnswer.includes('research')) contentScore += 15;
  
  // Uncertainty indicators (reduce confidence)
  if (safeAnswer.includes('may') || safeAnswer.includes('might') || 
      safeAnswer.includes('possibly') || safeAnswer.includes('unclear')) {
    contentScore -= 15;
  }
  
  // Disputed/conflicting/debunked (major penalty)
  if (lowerAnswer.includes('disputed') || lowerAnswer.includes('conflicting') || 
      lowerAnswer.includes('controversy') || lowerAnswer.includes('debunked') ||
      lowerAnswer.includes('the truth is') || lowerAnswer.includes('in fact')) {
    contentScore -= 25;
  }
  
  // Clamp contentScore to max 100
  contentScore = Math.min(contentScore, 100);
  
  // Source Quality Weight (30%)
  let sourceScore = 40;
  const sourceQualitySum = results.reduce((sum, r) => sum + calculateReliabilityScore(r.url || ''), 0);
  const avgSourceQuality = results.length > 0 ? sourceQualitySum / results.length : 60;
  sourceScore = Math.round(avgSourceQuality * 0.9); // Increased from 0.8 to give more weight to good sources
  
  // Government source bonus
  const hasGovSource = results.some(r => (r.url || '').toLowerCase().includes('.gov'));
  if (hasGovSource) sourceScore += 20;
  
  // Clamp sourceScore to max 100
  sourceScore = Math.min(sourceScore, 100);
  
  // Recency Weight (10%) - Temporal awareness
  let recencyScore = 50;
  const currentYear = new Date().getFullYear();
  
  // Established facts don't require recent sources
  if (!isEstablishedFact) {
    results.forEach(r => {
      const publishedDate = r.published_date || r.date;
      if (publishedDate) {
        const publishYear = new Date(publishedDate).getFullYear();
        const age = currentYear - publishYear;
        
        if (age === 0) recencyScore += 20; // This year
        else if (age === 1) recencyScore += 10; // Last year
        else if (age <= 3) recencyScore += 5; // Recent
        else if (age > 5) recencyScore -= 10; // Outdated
      }
    });
  } else {
    // For established facts, old sources are acceptable
    recencyScore = 80; // Don't penalize established facts for old sources
  }
  
  recencyScore = Math.min(Math.max(recencyScore, 30), 100);
  
  // Consensus Weight (20%)
  let consensusScore = 60;
  if (results.length >= 3) consensusScore += 18; // Multiple sources (increased)
  if (results.length >= 5) consensusScore += 12; // Strong consensus (increased)
  
  // Check for source diversity
  const domains = new Set(results.map(r => new URL(r.url || 'https://example.com').hostname));
  if (domains.size >= 3) consensusScore += 12; // Diverse sources (increased)
  
  // Contradiction detection - check if sources disagree
  const hedgeWords = ['however', 'but', 'although', 'despite', 'contradicts'];
  let contradictionPenalty = 0;
  hedgeWords.forEach(word => {
    if (safeAnswer.toLowerCase().includes(word)) contradictionPenalty += 5;
  });
  
  // Check for large variance in source reliability = disagreement
  if (results.length >= 3) {
    const reliabilities = results.map(r => calculateReliabilityScore(r.url));
    const max = Math.max(...reliabilities);
    const min = Math.min(...reliabilities);
    if (max - min > 30) contradictionPenalty += 10;
  }
  
  consensusScore -= Math.min(contradictionPenalty, 30);
  
  // Unanimous consensus bonus - check if all sources agree
  const allSourcesAgree = results.length > 2 && 
    !safeAnswer.toLowerCase().includes('however') && 
    !safeAnswer.toLowerCase().includes('but') &&
    !safeAnswer.toLowerCase().includes('disputed');
  if (allSourcesAgree) consensusScore += 18; // Increased from 15
  
  // Clamp consensusScore to max 100
  consensusScore = Math.min(consensusScore, 100);
  
  // Answer Quality Weight (10%) - Moderate scoring for completeness
  let answerQuality = 50;
  
  // Established facts don't need lengthy explanations
  if (isEstablishedFact) {
    if (safeAnswer.length > 80) answerQuality += 10; // Simple facts need simple answers
    if (safeAnswer.length > 200) answerQuality += 5; // Still reward detail
  } else {
    if (safeAnswer.length > 150) answerQuality += 10; // Detailed
    if (safeAnswer.length < 50) answerQuality -= 10; // Too brief
  }
  
  answerQuality = Math.min(Math.max(answerQuality, 30), 100);
  
  // If debunking detected, reduce positive contributions from sources and consensus
  let effectiveSourceScore = sourceScore;
  let effectiveConsensusScore = consensusScore;
  
  if (isDebunking) {
    // When sources are debunking the claim, high source quality actually means the claim is FALSE
    // So we reduce their positive contribution to final confidence
    effectiveSourceScore = Math.round(sourceScore * 0.4);
    effectiveConsensusScore = Math.round(consensusScore * 0.4);
    console.log(`📊 Debunking detected - reducing source/consensus weights`);
  }
  
  // Final weighted calculation: Content 30%, Source 30%, Consensus 20%, Recency 10%, Answer 10%
  let finalConfidence = Math.round(
    (contentScore * 0.3) + (effectiveSourceScore * 0.3) + (effectiveConsensusScore * 0.2) + 
    (recencyScore * 0.1) + (answerQuality * 0.1)
  );
  
  // If debunking, clamp to maximum 30%
  if (isDebunking) {
    finalConfidence = Math.min(finalConfidence, 30);
  }
  
  // Universal fact bonus - boost well-established facts with strong consensus
  if (isEstablishedFact && effectiveConsensusScore >= 90 && effectiveSourceScore >= 75) {
    finalConfidence = Math.min(finalConfidence + 15, 98); // +15 bonus for universally accepted facts
    console.log(`✨ Universal fact bonus applied: +15 points`);
  }
  
  // Minimum confidence for high-quality established facts
  if (isEstablishedFact && effectiveConsensusScore === 100 && effectiveSourceScore >= 80) {
    finalConfidence = Math.max(finalConfidence, 85); // Ensure minimum 85% for perfect consensus + good sources
  }
  
  // Log detailed scores for debugging
  console.log(`📊 Score breakdown: content=${contentScore}, source=${effectiveSourceScore}, consensus=${effectiveConsensusScore}, recency=${recencyScore}, quality=${answerQuality}, debunking=${isDebunking}, final=${finalConfidence}`);
  
  return Math.min(Math.max(finalConfidence, 5), 98); // Range 5-98%
}

// Detect fact type to adjust scoring appropriately
function detectFactType(content: string, answer: string): 'established-fact' | 'current-event' | 'disputed-claim' | 'opinion' {
  const lowerContent = content.toLowerCase();
  const lowerAnswer = answer.toLowerCase();
  
  // Opinion indicators
  if (lowerContent.match(/\b(i think|i believe|in my opinion|should|best|worst)\b/)) {
    return 'opinion';
  }
  
  // Disputed claim indicators
  if (lowerAnswer.match(/\b(disputed|conflicting|controversy|debate|unclear|uncertain)\b/)) {
    return 'disputed-claim';
  }
  
  // Current event indicators (needs recent sources)
  if (lowerContent.match(/\b(today|yesterday|this week|this month|recently|latest|breaking|now)\b/) ||
      lowerContent.match(/\b(202[3-9]|current|ongoing)\b/)) {
    return 'current-event';
  }
  
  // Established fact patterns
  const establishedPatterns = [
    // Geographic facts
    /\b(is in|located in|based in|situated in|found in)\b.*\b(country|city|state|region|continent)\b/i,
    /\b(manchester united|real madrid|barcelona|arsenal|chelsea)\b.*\b(england|spain|uk|london)\b/i,
    
    // Institutional facts (companies, teams, organizations)
    /\b(company|organization|team|club|university|institution)\b.*\b(headquartered|based|located|founded)\b/i,
    /\b(football|soccer|basketball|sports)\b.*\b(team|club)\b/i,
    
    // Historical facts (with dates)
    /\b(founded|established|created|born|died|built)\b.*\b(in |on )?(19|20)\d{2}\b/i,
    /\b(19|20)\d{2}\b.*\b(founded|established|created|born|died|built)\b/i,
    
    // Scientific constants
    /\b(speed of light|gravity|water boils|freezing point|speed of sound)\b/i,
    /\b(earth|sun|moon|planet)\b.*\b(orbit|rotation|distance|diameter)\b/i,
    
    // Mathematical facts
    /\b(pi equals|pi is|square root|pythagorean)\b/i,
    
    // Common knowledge
    /\b(capital of|president of|prime minister of|currency of)\b/i
  ];
  
  for (const pattern of establishedPatterns) {
    if (pattern.test(lowerContent)) {
      return 'established-fact';
    }
  }
  
  // Default to current-event (strict requirements)
  return 'current-event';
}

// Enhanced source reliability scoring with government verification priority
function calculateReliabilityScore(url: string): number {
  if (!url) return 50;
  
  const domain = String(url || '').toLowerCase();
  
  // Tier 0: Official government sources (98-100%)
  if (domain.includes('.gov') || domain.includes('whitehouse.gov') || 
      domain.includes('congress.gov') || domain.includes('fec.gov') ||
      domain.includes('ballotpedia.org')) {
    return 99; // Highest for official government
  }
  
  // Tier 1: Premium fact-checking and wire services (95-98%)
  if (domain.includes('reuters.com') || domain.includes('apnews.com') || 
      domain.includes('factcheck.org') || domain.includes('snopes.com') ||
      domain.includes('politifact.com')) {
    return 96;
  }
  
  // Tier 2: Major international news and agencies (90-94%)
  if (domain.includes('bbc.com') || domain.includes('npr.org') || 
      domain.includes('who.int') || domain.includes('cdc.gov') ||
      domain.includes('c-span.org') || domain.includes('pbs.org')) {
    return 92;
  }
  
  // Tier 3: Established news with strong editorial standards (85-89%)
  if (domain.includes('nytimes.com') || domain.includes('guardian.com') || 
      domain.includes('washingtonpost.com') || domain.includes('wsj.com') ||
      domain.includes('economist.com') || domain.includes('atlantic.com')) {
    return 87;
  }
  
  // Tier 4: Academic and research institutions (80-84%)
  if (domain.includes('.edu') || domain.includes('nature.com') || 
      domain.includes('science.org') || domain.includes('brookings.edu') ||
      domain.includes('pewresearch.org')) {
    return 82;
  }
  
  // Tier 5: Cable news and major media (75-79%)
  if (domain.includes('cnn.com') || domain.includes('foxnews.com') || 
      domain.includes('msnbc.com') || domain.includes('cbsnews.com') ||
      domain.includes('abcnews.go.com') || domain.includes('nbcnews.com')) {
    return 77;
  }
  
  // Tier 6: General reference and specialized sources (60-74%)
  if (domain.includes('wikipedia.org') || domain.includes('britannica.com') ||
      domain.includes('healthline.com') || domain.includes('mayoclinic.org')) {
    return 68;
  }
  
  // Penalty for low-quality indicators
  if (domain.includes('blog') || domain.includes('forum') || 
      domain.includes('social') || domain.includes('reddit') ||
      domain.includes('facebook') || domain.includes('twitter') ||
      domain.includes('tiktok') || domain.includes('instagram')) {
    return 30;
  }
  
  return 60; // Improved default reliability
}

function categorizeContent(content: string): string {
  const lower = String(content || '').toLowerCase();
  
  // Check for fiction first
  if (lower.includes('movie') || lower.includes('book') || lower.includes('show') || 
      lower.includes('game') || lower.includes('character') || lower.includes('series')) return 'fiction';
  
  if (lower.includes('health') || lower.includes('medical') || lower.includes('vaccine')) return 'health';
  if (lower.includes('political') || lower.includes('election') || lower.includes('government')) return 'politics';
  if (lower.includes('climate') || lower.includes('environment') || lower.includes('global warming')) return 'science';
  if (lower.includes('economic') || lower.includes('financial') || lower.includes('market')) return 'economics';
  if (lower.includes('technology') || lower.includes('tech') || lower.includes('ai')) return 'technology';
  
  return 'general';
}