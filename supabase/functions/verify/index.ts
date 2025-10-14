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
  console.log('🚀 [v2025-10-08-3] Starting verification process...');

  try {
    const body = await req.json();
    const user_id = body?.user_id;
    const safeContent = String(body?.content ?? '');
    const template = body?.template; // Template metadata from frontend

    // Input validation
    if (safeContent.trim().length === 0) {
      console.error('❌ No content provided');
      return new Response(
        JSON.stringify({ error: 'Content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Content length validation to prevent DoS and excessive API costs
    const MAX_CONTENT_LENGTH = 10000; // 10K characters
    const MAX_CONTENT_BYTES = 50000;  // 50KB

    if (safeContent.length > MAX_CONTENT_LENGTH) {
      console.error(`❌ Content too long: ${safeContent.length} characters`);
      return new Response(
        JSON.stringify({ 
          error: 'Content exceeds maximum length',
          max_length: MAX_CONTENT_LENGTH,
          provided_length: safeContent.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentBytes = new TextEncoder().encode(safeContent).length;
    if (contentBytes > MAX_CONTENT_BYTES) {
      console.error(`❌ Content too large: ${contentBytes} bytes`);
      return new Response(
        JSON.stringify({ error: 'Content size exceeds limit' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    // Validate result structure
    if (!result.category) {
      console.warn('⚠️ Result missing category, defaulting to "general"');
      result.category = 'general';
    }
    
    // Send grant verification email if category is ngo-grant
    if (result.category === 'ngo-grant' && verificationId && user_id) {
      try {
        console.log('📧 Triggering grant verification email...');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        // Fire and forget - don't block verification response
        fetch(`${supabaseUrl}/functions/v1/send-grant-verification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            verification_id: verificationId,
            send_admin_alert: true,
          }),
        }).catch(err => console.error('Email trigger failed:', err));
      } catch (emailErr) {
        console.warn('⚠️ Failed to trigger email:', emailErr);
      }
    }
    console.log(`📊 Confidence: ${result.confidence}% | Status: ${result.status}`);
    if (fraudAnalysis.hasFraudIndicators) {
      console.log(`⚠️ Fraud Alert: ${fraudAnalysis.patterns.length} patterns detected`);
    }

    // Generate Azure embedding for semantic analysis
    let azureEmbedding = null;
    // Parallelize embedding generation (will be awaited later)
    const embeddingPromise = (async () => {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        console.log('🧠 Generating Azure embedding...');
        const embeddingResponse = await fetch(
          `${supabaseUrl}/functions/v1/azure-generate-embedding`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ content: safeContent }),
          }
        );

        const embeddingData = await embeddingResponse.json();
        if (embeddingData.success) {
          console.log(`✅ Generated embedding (${embeddingData.dimensions} dimensions)`);
          return embeddingData.embeddings[0];
        }
        return null;
      } catch (embErr) {
        console.warn('⚠️ Failed to generate embedding:', embErr);
        return null;
      }
    })();

    // Await embedding generation (parallelized earlier)
    azureEmbedding = await embeddingPromise;
    
    // Save verification to database
    let verificationId = null;
    if (user_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Save verification with embedding
        const { data: verification, error: dbError } = await supabase
          .from('verifications')
          .insert({
            user_id: user_id,
            content: safeContent,
            content_type: 'text', // Always use 'text' for text-based verifications
            trust_score: result.confidence,
            result_summary: result.summary,
            category: result.category,
            status: 'completed', // Map to DB-safe status
            processing_time_ms: processingTime,
            azure_embedding: azureEmbedding,
            score_breakdown: {
              source_consensus: result.source_consensus,
              verification_method: result.verification_method
            }
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error saving verification:', dbError);
        } else {
          verificationId = verification.id;
          console.log(`💾 Verification saved with ID: ${verificationId}`);

          // Save sources
          if (result.sources && result.sources.length > 0) {
            const sourcesToInsert = (result.sources || [])
              .filter((s) => typeof s.url === 'string' && s.url.startsWith('http'))
              .map((source) => {
                let domain = null;
                try {
                  domain = new URL(source.url).hostname.replace(/^www\./, '');
                } catch (err) {
                  console.warn(`Failed to extract domain from URL: ${source.url}`);
                }
                const reliability = Math.max(0, Math.min(100, Number(source.reliability_score ?? 60)));
                return {
                  verification_id: verificationId,
                  url: source.url,
                  title: source.title ?? null,
                  content_snippet: source.snippet || (source as any).content_snippet || '',
                  full_content: (source as any).full_content || '',
                  reliability_score: reliability,
                  domain,
                  source_type: (source as any).source_type || 'news',
                  source_region: detectSourceRegion(domain || '')
                };
              });

            const { error: sourcesError } = await supabase
              .from('sources')
              .insert(sourcesToInsert);

            if (sourcesError) {
              console.error('Error saving sources:', sourcesError);
            } else {
              console.log(`💾 Saved ${sourcesToInsert.length} sources`);
            }
          }
        }
      } catch (err) {
        console.error('Error in database save:', err);
      }
    }

    return new Response(
      JSON.stringify({
        ...result,
        verificationId: verificationId
      }),
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
  
  const cleanContent = String(content).replace(/<[^>]+>/g, '').trim();
  
  return {
    confidence: 95,
    status: 'verified',
    summary: `**📚 FICTIONAL CONTENT DETECTED**\n\nConfidence: 95%\nStatus: VERIFIED\n\nThis appears to be about fictional content (books, movies, games, etc.). Fiction is neither true nor false - it's creative storytelling.\n\nContent:\n${cleanContent}`,
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
  
  const cleanContent = String(content).replace(/<[^>]+>/g, '').trim();
  
  return {
    confidence: 50,
    status: 'inconclusive',
    summary: `**💭 OPINION DETECTED**\n\nConfidence: 50%\nStatus: INCONCLUSIVE\n\nThis appears to be a subjective opinion or personal belief. Opinions cannot be fact-checked as true or false.\n\nContent:\n${cleanContent}`,
    analysis: 'This content expresses a personal opinion or subjective judgment, which is not subject to objective verification. Opinions are personal viewpoints that may vary from person to person and are neither factually true nor false.',
    sources: [],
    source_consensus: 50,
    verification_method: ['Opinion Detection'],
    category: 'opinion',
    created_at: new Date().toISOString(),
    processing_time: 0
  };
}

// Helper: Build a compact query for Tavily API (max 380 chars)
function buildCompactTavilyQuery(content: string, category?: string, template?: any): string {
  // Remove source lines and URLs
  let cleaned = content
    .replace(/Source:\s*https?:\/\/[^\s]+/gi, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/\[[^\]]+\]/g, '') // Remove reference markers like [1], [Image 1 of 8]
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract headline/first sentence (up to 200 chars)
  let snippet = cleaned.substring(0, 200);
  if (cleaned.length > 200) {
    const lastPeriod = snippet.lastIndexOf('.');
    if (lastPeriod > 50) snippet = snippet.substring(0, lastPeriod + 1);
  }
  
  // Add context hint
  let hint = 'Verify this claim: ';
  if (template?.name) {
    hint = `${template.industry || 'general'} verification: `;
  } else if (category && category !== 'general') {
    hint = `${category} fact-check: `;
  }
  
  // Compose query with strict limit
  const maxLength = 380;
  let query = `${hint}"${snippet}"`;
  
  if (query.length > maxLength) {
    const available = maxLength - hint.length - 4; // -4 for quotes and ellipsis
    snippet = snippet.substring(0, available) + '...';
    query = `${hint}"${snippet}"`;
  }
  
  console.log(`📏 Tavily query length: ${query.length} chars (max: 400)`);
  return query;
}

// Extract domain from content if URL exists
function extractSourceDomain(content: string): string | null {
  const urlMatch = content.match(/https?:\/\/([^\s\/]+)/i);
  if (urlMatch) {
    const domain = urlMatch[1].replace(/^www\./, '');
    console.log(`🌐 Source domain detected: ${domain}`);
    return domain;
  }
  return null;
}

// Retry wrapper for Tavily API calls with exponential backoff
async function callTavilyWithRetry(requestBody: any, maxRetries = 2): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tavily API attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        console.log('✅ Tavily API call successful');
        return await response.json();
      }
      
      // Log detailed error information
      const errorBody = await response.text();
      console.error(`🚨 Tavily API Error (Attempt ${attempt + 1}/${maxRetries + 1}):`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // If rate limited (429) or server error (5xx), retry with exponential backoff
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Rate limited or server error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors (like 400), throw immediately without retry
      throw new Error(`Tavily API error: ${response.status} ${response.statusText} - ${errorBody}`);
      
    } catch (error) {
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      // Otherwise, continue to next retry
      console.log(`⚠️ Attempt ${attempt + 1} failed, will retry...`);
    }
  }
  throw new Error('Tavily API: All retry attempts exhausted');
}

// Perplexity API fallback verification
async function verifyWithPerplexity(content: string, template?: any): Promise<VerificationResult> {
  const startTime = Date.now();
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not configured');
    throw new Error('Perplexity API key not configured');
  }
  
  console.log('🔮 Using Perplexity API for verification...');
  
  try {
    const safeContent = String(content).substring(0, 2000);
    
    // Build focused prompt
    let prompt = `Analyze and fact-check this claim: "${safeContent}"\n\n`;
    prompt += 'Provide:\n1. A confidence score (0-100)\n2. Verification status (verified/likely_accurate/inconclusive/likely_false/false)\n';
    prompt += '3. Brief analysis with evidence\n4. List credible sources\n';
    
    if (template?.industry === 'bank') {
      prompt += '\nFocus on financial fraud detection and banking security.';
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional fact-checker. Provide accurate, evidence-based verification with specific sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('🚨 Perplexity API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`Perplexity API error: ${response.status} - ${errorBody}`);
    }
    
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || '';
    
    console.log('📊 Perplexity response received');
    
    // Parse confidence and status from response
    let confidence = 50;
    let status = 'inconclusive';
    
    // Try to extract confidence score
    const confidenceMatch = analysis.match(/confidence[:\s]+(\d+)/i);
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1]);
    }
    
    // Try to extract status
    if (analysis.toLowerCase().includes('verified') || analysis.toLowerCase().includes('true')) {
      status = confidence >= 80 ? 'verified' : 'likely_accurate';
    } else if (analysis.toLowerCase().includes('false')) {
      status = confidence >= 80 ? 'false' : 'likely_false';
    }
    
    return {
      confidence,
      status,
      summary: `**🔮 PERPLEXITY VERIFICATION**\n\nConfidence: ${confidence}%\nStatus: ${status.toUpperCase().replace('_', ' ')}\n\n${analysis}`,
      analysis,
      sources: [], // Perplexity doesn't return structured sources
      source_consensus: confidence,
      verification_method: ['Perplexity AI'],
      category: categorizeContent(safeContent),
      created_at: new Date().toISOString(),
      processing_time: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('🚨 Perplexity verification failed:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

async function verifyWithTavily(content: string, apiKey: string, template?: any): Promise<VerificationResult> {
  const startTime = Date.now();
  
  try {
    const safeContent = String(content ?? '');
    
    // Initialize Supabase client for category detection and source scoring
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Detect content category using ML-powered detection
    const detectedCategories = await detectContentCategory(safeContent, supabase);
    const primaryCategory = detectedCategories.length > 0 ? detectedCategories[0] : null;
    
    console.log(`🎯 Category detection: ${primaryCategory ? `${primaryCategory.displayName} (${primaryCategory.confidence}% confidence)` : 'general'}`);
    if (primaryCategory) {
      console.log(`📋 Matched keywords: ${primaryCategory.matchedKeywords.slice(0, 3).join(', ')}`);
      console.log(`🔍 Min sources required: ${primaryCategory.minSources}, Max age: ${primaryCategory.maxSourceAgeDays ? `${primaryCategory.maxSourceAgeDays} days` : 'unlimited'}`);
    }
    
    // Build compact query for Tavily (max 380 chars to stay under 400 limit)
    const categoryName = primaryCategory?.category || 'general';
    const query = buildCompactTavilyQuery(safeContent, categoryName, template);
    
    // Extract source domain if URL exists in content
    const sourceDomain = extractSourceDomain(safeContent);
    
    console.log('🔍 Sending request to Tavily Search API with retry logic...');
    
    // Build request with optional domain filtering
    const tavilyRequest: any = {
      api_key: apiKey,
      query: query,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: true,
      max_results: 8,
      include_domains: ["reuters.com", "bbc.com", "cnn.com", "npr.org", "apnews.com", "factcheck.org", "snopes.com", "politifact.com", "nytimes.com"]
    };
    
    // If we detected a source domain, prioritize it
    if (sourceDomain) {
      console.log(`🎯 Prioritizing source domain: ${sourceDomain}`);
      tavilyRequest.include_domains = [sourceDomain, ...tavilyRequest.include_domains];
    }
    
    // Use retry wrapper for Tavily API call
    const data = await callTavilyWithRetry(tavilyRequest);
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
      console.warn('⚠️ Generic response detected from Tavily. Falling back to Perplexity...');
      try {
        const perplexityResult = await verifyWithPerplexity(String(content), template);
        console.log('✅ Perplexity fallback succeeded with confidence:', perplexityResult.confidence);
        return perplexityResult;
      } catch (perplexityError) {
        console.error('❌ Perplexity fallback also failed:', perplexityError);
        return {
          confidence: 55,
          status: 'INCONCLUSIVE',
          summary: `**⚡ VERIFICATION INCOMPLETE**\n\nConfidence: 55%\nStatus: INCONCLUSIVE\n\nBoth primary and fallback verification sources returned generic information. This content may require manual fact-checking.`,
          analysis: 'Unable to obtain specific verification through automated sources. Both Tavily and Perplexity returned insufficient information.',
          sources: [],
          source_consensus: 55,
          verification_method: ['Tavily Generic Response', 'Perplexity Fallback Failed'],
          category: categorizeContent(safeContent),
          created_at: new Date().toISOString(),
          processing_time: Date.now() - startTime
        };
      }
    }
    
    // Batch process sources with single database call for reliability scores
    console.log(`⚡ Batch processing ${searchResults.length} sources...`);
    const sourceUrls = searchResults.map((r: any) => r.url || '');
    const baseScoreData = sourceUrls.map((url: string) => calculateBaseReliabilityScore(url));
    
    const domains = baseScoreData.map(d => d.domain);
    const baseScores = baseScoreData.map(d => d.baseScore);
    
    // Single batch database call for all adjusted scores
    const { data: batchScores, error: batchError } = await supabase.rpc('get_adjusted_source_scores_batch', {
      _domains: domains,
      _base_scores: baseScores
    });
    
    if (batchError) {
      console.error('❌ Batch score fetch failed:', batchError);
    }
    
    const scoresMap = new Map();
    if (batchScores && Array.isArray(batchScores)) {
      batchScores.forEach((score: any) => {
        scoresMap.set(score.domain, score.adjusted_score);
      });
    }
    
    const sourcesWithScores = searchResults.map((result: any, idx: number) => {
      const baseData = baseScoreData[idx];
      const adjustedScore = scoresMap.get(baseData.domain) || baseData.baseScore;
      
      return {
        title: result.title || 'Unknown Source',
        url: result.url || '',
        content_snippet: result.content ? result.content.substring(0, 200) + '...' : '',
        full_content: result.content || '',
        reliability_score: adjustedScore,
        base_reliability_score: baseData.baseScore,
        domain: baseData.domain,
        source_region: baseData.region,
        source_type: baseData.sourceType
      };
    });
    
    console.log(`✅ Batch processed ${sourcesWithScores.length} sources`);

    // Calculate confidence based on search results quality
    let confidence = await calculateTavilyConfidenceWithCategory(
      answer, 
      sourcesWithScores, 
      content,
      primaryCategory,
      supabase
    );
    
    // Calculate average reliability ONCE (used in refutation logic and status determination)
    const avgReliability = sourcesWithScores.length > 0 
      ? Math.round(sourcesWithScores.reduce((sum, s) => sum + s.reliability_score, 0) / sourcesWithScores.length)
      : 0;

    // Calculate source consensus score BEFORE refutation logic (needed for override check)
    const sourceAgreement = sourcesWithScores.length > 0
      ? (sourcesWithScores.filter(s => s.reliability_score >= 70).length / sourcesWithScores.length) * 100
      : 100;
    const sourceConsensus = Math.round(sourceAgreement);

    // Parallelize refutation detection (runs alongside other operations)
    const refutationPromise = (async () => {
      try {
        console.log('🧠 Performing semantic refutation analysis...');
        
        const refutationAnalysis = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/detect-refutation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claim: content,
            answer: answer,
            sources: {
              count: sourcesWithScores.length,
              avg_reliability: avgReliability
            }
          })
        });

        return await refutationAnalysis.json();
      } catch (err) {
        console.error('⚠️ Refutation detection failed:', err);
        return { is_refutation: false, confidence: 0, refutation_type: 'none', reasoning: '' };
      }
    })();
    
    // Await refutation result
    const refutationResult = await refutationPromise;
    let isRefuted = false;
    let refutationConfidence = 0;
    let refutationType = 'none';
    let refutationReasoning = '';
    refutationReasoning = refutationResult.reasoning || '';
    
    // Only treat as refutation if:
    // 1. AI detected it as refutation
    // 2. Confidence is high (>70%)
    // 3. Type is "direct" (not partial)
    // 4. Source consensus is weak (<60%) OR source reliability is low (<65%)
    
    if (refutationResult.is_refutation && 
        refutationResult.confidence > 70 && 
        refutationResult.refutation_type === 'direct') {
      
      // Additional safety check: if sources strongly agree (consensus >80%) and have high reliability,
      // do NOT mark as refuted even if AI thinks so
      if (avgReliability < 65 || sourceConsensus < 60) {
        isRefuted = true;
        refutationConfidence = refutationResult.confidence;
        refutationType = refutationResult.refutation_type;
        
        // Reduce confidence proportionally to refutation confidence
        const reductionFactor = refutationConfidence / 100;
        const originalConfidence = confidence;
        confidence = Math.round(confidence * (1 - (reductionFactor * 0.7))); // Max 70% reduction
        confidence = Math.max(confidence, 20); // Floor at 20% (not 30%)
        
        console.log(`🚨 REFUTATION DETECTED: ${refutationReasoning}`);
        console.log(`📊 Refutation confidence: ${refutationConfidence}%, reducing trust score from ${originalConfidence}% to ${confidence}%`);
      } else {
        console.log(`✅ REFUTATION IGNORED: High source consensus (${sourceConsensus}%) and reliability (${avgReliability}%) override AI detection`);
        console.log(`📝 AI reasoning (overridden): ${refutationReasoning}`);
      }
    } else {
      console.log(`✅ No refutation detected (AI confidence: ${refutationResult.confidence}%, type: ${refutationResult.refutation_type})`);
    }
    
    let status = getStatusFromConfidence(confidence);
    
    // Only force FALSE status if:
    // 1. Confirmed refutation detected
    // 2. Low confidence (<40%)
    // 3. Refutation type is "direct"
    // 4. Source reliability is also low (<65%)
    
    if (isRefuted && 
        confidence < 40 && 
        refutationType === 'direct' &&
        avgReliability < 65) {
      status = 'false';
      console.log(`❌ Status set to FALSE due to direct refutation with low confidence and weak sources`);
    }
    
    // Create concise verdict summary
    let verdict = '';
    if (confidence >= 80) verdict = 'Highly credible claim';
    else if (confidence >= 70) verdict = 'Likely accurate claim';
    else if (confidence >= 55) verdict = 'Inconclusive - mixed evidence';
    else if (confidence >= 40) verdict = 'Disputed claim';
    else verdict = 'Likely false claim';
    
    // Only override verdict if refutation is strong
    if (isRefuted && refutationConfidence > 80 && refutationType === 'direct') {
      verdict = 'Claim refuted by evidence';
    }
    
    const summary = `${verdict} (${confidence}% confidence). ${answer ? answer.split('.')[0] + '.' : `Analyzed ${searchResults.length} sources.`}`;
    
    // Build structured analysis_points
    const analysis_points = [];
    
    // Why this score
    const topSources = sourcesWithScores.slice(0, 3);
    
    analysis_points.push(`**Why this confidence score**: Based on ${sourcesWithScores.length} sources with average reliability of ${avgReliability}%`);
    
    // Sources overview
    if (topSources.length > 0) {
      const domains = topSources.map(s => s.domain || new URL(s.url).hostname.replace('www.', '')).join(', ');
      analysis_points.push(`**Sources checked**: ${domains}`);
    }
    
    // Supporting evidence
    if (confidence >= 70 && answer) {
      const supportPoints = answer.split('.').slice(1, 3).filter(s => s.trim().length > 10);
      if (supportPoints.length > 0) {
        analysis_points.push(`**Supporting evidence**: ${supportPoints[0].trim()}`);
      }
    }
    
    // Contradicting evidence (if any) - now with AI reasoning
    if (isRefuted && refutationConfidence > 70) {
      analysis_points.push(`**Contradicting evidence**: ${refutationReasoning || 'Multiple sources dispute this claim or provide counterevidence'}`);
    } else if (confidence < 60 && !isRefuted) {
      analysis_points.push(`**Weak evidence**: Sources provide insufficient or contradictory information`);
    }
    
    // Category context
    if (primaryCategory) {
      analysis_points.push(`**Category**: ${primaryCategory.displayName} - verified using specialized ${primaryCategory.category} criteria`);
    }
    
    return {
      confidence,
      status,
      summary,
      analysis: answer || `Based on ${searchResults.length} sources found, this claim has been evaluated for accuracy using real-time web search and reliable news sources.`,
      analysis_points,
      sources: sourcesWithScores,
      source_consensus: confidence,
      verification_method: ['Tavily Search', 'Real-time Web Search', 'Source Analysis', primaryCategory ? 'Category-Specific Verification' : ''].filter(Boolean),
      category: primaryCategory?.category || categorizeContent(safeContent),
      created_at: new Date().toISOString(),
      processing_time: Date.now() - startTime,
      ...(primaryCategory && {
        categoryMetadata: {
          name: primaryCategory.category,
          displayName: primaryCategory.displayName,
          confidence: primaryCategory.confidence,
          matchedKeywords: primaryCategory.matchedKeywords,
          criteria: primaryCategory.criteria
        }
      }),
      ...(detectedCategories.length > 0 && {
        detectedCategories: detectedCategories.map(cat => ({
          name: cat.category,
          confidence: cat.confidence
        }))
      })
    };

  } catch (tavilyError) {
    console.error('🚨 Tavily API failed, attempting Perplexity fallback:', {
      errorMessage: tavilyError instanceof Error ? tavilyError.message : String(tavilyError),
      errorStack: tavilyError instanceof Error ? tavilyError.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Try Perplexity as fallback
    try {
      console.log('🔄 Falling back to Perplexity API...');
      return await verifyWithPerplexity(content, template);
    } catch (perplexityError) {
      console.error('🚨 Perplexity fallback also failed:', {
        errorMessage: perplexityError instanceof Error ? perplexityError.message : String(perplexityError),
        timestamp: new Date().toISOString()
      });
      
      // Return basic fallback result if both APIs fail
      return {
        confidence: 20,
        status: 'inconclusive',
        summary: `**⚡ VERIFICATION SERVICES UNAVAILABLE**\n\nConfidence: 20%\nStatus: INCONCLUSIVE\n\nBoth primary and backup verification services are temporarily unavailable. Using basic content analysis.`,
        analysis: `All verification APIs temporarily unavailable. Content analyzed: ${String(content).length} characters. Unable to cross-reference with external sources at this time. Please try again later.`,
        sources: [],
        source_consensus: 20,
        verification_method: ['Fallback Analysis - All APIs Failed'],
        category: categorizeContent(String(content)),
        created_at: new Date().toISOString(),
        processing_time: Date.now() - startTime
      };
    }
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

// Enhanced multi-factor confidence calculation with category-specific weights
async function calculateTavilyConfidenceWithCategory(
  answer: string, 
  results: any[], 
  originalContent: string = '',
  category: CategoryMatch | null = null,
  supabaseClient: any
): Promise<number> {
  // Use category-specific weights if available, otherwise use defaults
  const weights = category?.weights || {
    source_quality: 0.30,
    consensus: 0.20,
    recency: 0.10,
    completeness: 0.10,
    content_analysis: 0.30
  };
  
  console.log(`📊 Using confidence weights:`, weights);
  
  return calculateTavilyConfidence(answer, results, originalContent, weights, category, supabaseClient);
}

// Enhanced multi-factor confidence calculation with fact category bonuses
// Returns both the confidence score and detailed breakdown
async function calculateTavilyConfidence(
  answer: string, 
  results: any[], 
  originalContent: string = '',
  customWeights: any = null,
  category: CategoryMatch | null = null,
  supabaseClient: any = null
): Promise<number> {
  // Use custom weights or defaults
  const weights = customWeights || {
    source_quality: 0.30,
    consensus: 0.20,
    recency: 0.10,
    completeness: 0.10,
    content_analysis: 0.30
  };
  const safeAnswer = String(answer ?? '');
  const lowerAnswer = safeAnswer.toLowerCase();
  const safeContent = String(originalContent ?? '').toLowerCase();
  
  // Detect fact type for scoring adjustments
  const factType = detectFactType(safeContent, safeAnswer);
  const isEstablishedFact = factType === 'established-fact';
  
  console.log(`🎯 Fact type detected: ${factType}${isEstablishedFact ? ' (applying universal fact bonuses)' : ''}`);
  
  // Content Analysis Weight (30%) - Evidence-based scoring
  let contentScore = isEstablishedFact ? 75 : 50; // Higher baseline for established facts
  
  // NOTE: Refutation detection is now handled by semantic AI analysis in the main verification flow
  // Old pattern-matching negation logic has been removed to prevent false positives
  
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
  
  // Disputed/conflicting/debunked indicators (major penalty)
  const isDebunking =
    lowerAnswer.includes('disputed') ||
    lowerAnswer.includes('conflicting') ||
    lowerAnswer.includes('controversy') ||
    lowerAnswer.includes('debunked') ||
    lowerAnswer.includes('the truth is') ||
    lowerAnswer.includes('in fact');

  if (isDebunking) {
    contentScore -= 25;
  }
  
  // Clamp contentScore to max 100
  contentScore = Math.min(contentScore, 100);
  
  // Source Quality Weight (30%) - now using pre-calculated scores from async function
  let sourceScore = 40;
  
  // Check if results have reliability_score already (from async processing)
  const hasPreScored = results.length > 0 && results[0].reliability_score !== undefined;
  
  if (hasPreScored) {
    // Use pre-calculated adjusted scores
    const sourceQualitySum = results.reduce((sum: number, r: any) => sum + (r.reliability_score || 60), 0);
    const avgSourceQuality = results.length > 0 ? sourceQualitySum / results.length : 60;
    sourceScore = Math.round(avgSourceQuality * 0.9);
  } else if (supabaseClient) {
    // Use dynamic scoring with supabase client
    const scoredResults = await Promise.all(
      results.map(async (r: any) => {
        const scoreData = await calculateReliabilityScore(r.url || '', supabaseClient);
        return scoreData.adjustedScore;
      })
    );
    const avgReliability = scoredResults.length > 0 ? scoredResults.reduce((a, b) => a + b, 0) / scoredResults.length : 60;
    sourceScore = Math.round(avgReliability * 0.9);
  } else {
    // Fallback: calculate synchronously with base scores only
    const syncScores = results.map(r => {
      const url = r.url || '';
      const domain = url.toLowerCase();
      if (domain.includes('.gov')) return 99;
      if (domain.includes('factcheck') || domain.includes('snopes')) return 96;
      if (domain.includes('reuters') || domain.includes('bbc')) return 88;
      if (domain.includes('.edu')) return 84;
      return 60;
    });
    const avgSourceQuality = syncScores.length > 0 ? syncScores.reduce((a, b) => a + b, 0) / syncScores.length : 60;
    sourceScore = Math.round(avgSourceQuality * 0.9);
  }
  
  // Government source bonus
  const hasGovSource = results.some((r: any) => (r.url || '').toLowerCase().includes('.gov'));
  if (hasGovSource) sourceScore += 20;
  
  // Category-specific source type requirements check
  if (category?.requiredSourceTypes && category.requiredSourceTypes.length > 0) {
    const hasRequiredTypes = category.requiredSourceTypes.some(reqType => 
      results.some((r: any) => r.source_type === reqType)
    );
    if (!hasRequiredTypes) {
      sourceScore -= 15; // Penalty for missing required source types
      console.log(`⚠️ Missing required source types: ${category.requiredSourceTypes.join(', ')}`);
    }
  }
  
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
    recencyScore = 90; // Strong recency baseline for established facts
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
  if (!isEstablishedFact) {
    hedgeWords.forEach(word => {
      if (safeAnswer.toLowerCase().includes(word)) contradictionPenalty += 5;
    });
  }
  
  // Check for large variance in source reliability = disagreement
  if (results.length >= 3 && results[0].reliability_score !== undefined) {
    const reliabilities = results.map(r => r.reliability_score || 60);
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
  
  // Moderate established-fact boost and floor
  if (isEstablishedFact && !isDebunking && effectiveConsensusScore >= 80 && effectiveSourceScore >= 70) {
    finalConfidence = Math.min(finalConfidence + 10, 96);
    finalConfidence = Math.max(finalConfidence, 88);
  }

  // Sports achievements known-fact boost: push well-known club/nation titles higher
  const sportsKeywords = /\b(premier league|la liga|serie a|bundesliga|champions league|ucl|fa cup|carabao cup|copa del rey|europa league|world cup|olympics|championship|league title|trophy)\b/i;
  if (isEstablishedFact && sportsKeywords.test(safeContent)) {
    finalConfidence = Math.max(finalConfidence, 92);
    finalConfidence = Math.min(finalConfidence + 5, 97);
  }
  
  // Current event boost: well-documented recent events with perfect consensus deserve high confidence
  const isCurrentEvent = factType === 'current-event';
  if (isCurrentEvent && effectiveConsensusScore === 100 && effectiveSourceScore >= 75 && !isDebunking) {
    // Perfect consensus + good sources + not debunked = highly credible current event
    finalConfidence = Math.max(finalConfidence, 85); // Ensure minimum 85% for well-verified current events
    if (effectiveSourceScore >= 85) {
      finalConfidence = Math.max(finalConfidence, 88); // Exceptional sources push to 88%+
    }
    console.log(`🔥 Current event boost applied: consensus=${effectiveConsensusScore}%, sources=${effectiveSourceScore}%`);
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
  
  // Established fact patterns (check BEFORE current-event)
  // Extended handling for sports facts without explicit years, while guarding against current-season phrasing.
  const currentEventIndicators = /\b(today|yesterday|this week|this month|recently|latest|breaking|now|this season|last season|this year|last year|currently|ongoing)\b|\b20\d{2}\/\d{2}\b/i;
  
  const establishedPatterns = [
    // Geographic facts
    /\b(is in|located in|based in|situated in|found in)\b.*\b(country|city|state|region|continent)\b/i,
    /\b(manchester united|real madrid|barcelona|arsenal|chelsea)\b.*\b(england|spain|uk|london)\b/i,
    
    // Institutional facts (companies, teams, organizations)
    /\b(company|organization|team|club|university|institution)\b.*\b(headquartered|based|located|founded)\b/i,
    /\b(football|soccer|basketball|sports)\b.*\b(team|club)\b/i,
    
    // Historical facts (with dates)
    /\b(founded|established|created|born|died|built|won|awarded|broke|set)\b.*\b(in |on )?(19|20)\d{2}\b/i,
    /\b(19|20)\d{2}\b.*\b(founded|established|created|born|died|built|won|awarded|broke|set)\b/i,
    // Sports achievements and records (treated as established facts once in past)
    /\b(won|captured|secured|took)\b.*\b(title|trophy|award|ballon d'or|world cup|olympics|championship|ballon d’ors?)\b.*\b(19|20)\d{2}\b/i,
    /\b(19|20)\d{2}\b.*\b(won|awarded|broke|set)\b.*\b(record|title|award|ballon d'or|world cup|olympics|championship|ballon d’ors?)\b/i,
    /\b(record for most wins|most .* wins|all-time record)\b/i,
    
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
  
  // Sports achievements without explicit year (treat as established if not phrased as current-season)
  const sportsNoYearPattern = /\b(has won|have won|won)\b.*\b(premier league|la liga|serie a|bundesliga|champions league|ucl|fa cup|carabao cup|copa del rey|europa league|world cup|olympics|championship|league title|trophy)\b/i;
  if (sportsNoYearPattern.test(lowerContent) && !currentEventIndicators.test(lowerContent)) {
    return 'established-fact';
  }
  
  // Current event indicators (needs recent sources)
  if (currentEventIndicators.test(lowerContent)) {
    return 'current-event';
  }
  
  // Default to current-event (strict requirements)
  return 'current-event';
}

// Calculate base reliability score (no database call)
function calculateBaseReliabilityScore(url: string): {
  baseScore: number;
  domain: string;
  region: string;
  sourceType: string;
} {
  if (!url) return { baseScore: 50, domain: '', region: 'Global', sourceType: 'general' };
  
  const domain = String(url || '').toLowerCase();
  let extractedDomain = '';
  try {
    extractedDomain = new URL(url).hostname.replace('www.', '');
  } catch (e) {
    extractedDomain = domain;
  }
  
  let baseScore = 60;
  let region = 'Global';
  let sourceType = 'general';
  
  // Tier 1: International Government and official sources (98-99)
  if (domain.includes('.gov') || domain.includes('cdc.gov') || 
      domain.includes('nih.gov') || domain.includes('who.int') ||
      domain.includes('.gov.uk') || domain.includes('.gc.ca') ||
      domain.includes('.canada.ca') || domain.includes('.gov.au') ||
      domain.includes('europa.eu') || domain.includes('ec.europa.eu') ||
      domain.includes('un.org') || domain.includes('.gouv.fr') ||
      domain.includes('.bundesregierung.de') || domain.includes('whitehouse.gov') ||
      domain.includes('congress.gov') || domain.includes('fec.gov') ||
      domain.includes('ballotpedia.org')) {
    baseScore = 99;
    sourceType = 'government';
    if (domain.includes('.gov.uk')) region = 'UK';
    else if (domain.includes('.gc.ca') || domain.includes('.canada.ca')) region = 'CA';
    else if (domain.includes('.gov.au')) region = 'AU';
    else if (domain.includes('europa.eu') || domain.includes('ec.europa.eu') || 
             domain.includes('.gouv.fr') || domain.includes('.bundesregierung.de')) region = 'EU';
    else region = 'US';
  }
  
  // Tier 2: International Fact-checking organizations (94-96)
  else if (domain.includes('snopes.com') || domain.includes('factcheck.org') ||
      domain.includes('politifact.com') || domain.includes('reuters.com/fact-check') ||
      domain.includes('fullfact.org') || domain.includes('correctiv.org') ||
      domain.includes('chequeado.com') || domain.includes('aos-fatos.org') ||
      domain.includes('africacheck.org') || domain.includes('factcheck.afp.com') ||
      domain.includes('leadstories.com')) {
    baseScore = 96;
    sourceType = 'fact-checker';
    if (domain.includes('fullfact.org')) region = 'UK';
    else if (domain.includes('correctiv.org')) region = 'EU';
    else if (domain.includes('chequeado.com')) region = 'Global';
    else if (domain.includes('aos-fatos.org')) region = 'Global';
    else if (domain.includes('africacheck.org')) region = 'Global';
    else region = 'US';
  }
  
  // Tier 3: International Major news outlets (85-92)
  else if (domain.includes('reuters.com') || domain.includes('apnews.com') ||
      domain.includes('bbc.com') || domain.includes('bbc.co.uk') ||
      domain.includes('theguardian.com') || domain.includes('npr.org') ||
      domain.includes('ft.com') || domain.includes('independent.co.uk') ||
      domain.includes('cbc.ca') || domain.includes('theglobeandmail.com') ||
      domain.includes('thestar.com') || domain.includes('abc.net.au') ||
      domain.includes('smh.com.au') || domain.includes('theage.com.au') ||
      domain.includes('dw.com') || domain.includes('france24.com') ||
      domain.includes('elpais.com') || domain.includes('lemonde.fr') ||
      domain.includes('c-span.org') || domain.includes('pbs.org')) {
    baseScore = 88;
    sourceType = 'news';
    if (domain.includes('bbc.') || domain.includes('theguardian.') || 
        domain.includes('ft.com') || domain.includes('independent.co.uk')) region = 'UK';
    else if (domain.includes('cbc.ca') || domain.includes('theglobeandmail.') || 
             domain.includes('thestar.')) region = 'CA';
    else if (domain.includes('abc.net.au') || domain.includes('smh.com.au') || 
             domain.includes('theage.com.au')) region = 'AU';
    else if (domain.includes('dw.com') || domain.includes('france24.') || 
             domain.includes('elpais.') || domain.includes('lemonde.')) region = 'EU';
    else region = 'US';
  }
  
  // Tier 4: International Academic sources (80-84)
  else if (domain.includes('.edu') || domain.includes('scholar.google') ||
      domain.includes('ncbi.nlm.nih.gov') || domain.includes('nature.com') ||
      domain.includes('sciencedirect.com') || domain.includes('.ac.uk') ||
      domain.includes('.edu.au') || domain.includes('.ac.jp') ||
      domain.includes('.edu.cn') || domain.includes('.ac.in') ||
      domain.includes('.ac.za') || domain.includes('science.org') ||
      domain.includes('brookings.edu') || domain.includes('pewresearch.org')) {
    baseScore = 84;
    sourceType = 'academic';
    if (domain.includes('.ac.uk')) region = 'UK';
    else if (domain.includes('.edu.au')) region = 'AU';
    else if (domain.includes('.ac.jp')) region = 'Global';
    else if (domain.includes('.edu.cn')) region = 'Global';
    else if (domain.includes('.ac.in')) region = 'Global';
    else if (domain.includes('.ac.za')) region = 'Global';
    else region = 'US';
  }
  
  // Tier 5: Reputable media (75-87)
  else if (domain.includes('nytimes.com') || domain.includes('washingtonpost.com') ||
      domain.includes('wsj.com') || domain.includes('economist.com') ||
      domain.includes('atlantic.com')) {
    baseScore = 87;
    sourceType = 'news';
    region = 'US';
  }
  
  // Tier 6: Cable news and major media (65-77)
  else if (domain.includes('cnn.com') || domain.includes('nbcnews.com') ||
      domain.includes('cbsnews.com') || domain.includes('abcnews.go.com') ||
      domain.includes('foxnews.com') || domain.includes('msnbc.com')) {
    baseScore = 77;
    sourceType = 'news';
    region = 'US';
  }
  
  // Tier 7: General reference (60-68)
  else if (domain.includes('wikipedia.org') || domain.includes('britannica.com') ||
      domain.includes('healthline.com') || domain.includes('mayoclinic.org')) {
    baseScore = 68;
    sourceType = 'general';
    region = 'Global';
  }
  
  // Tier 8: Social media and others (30)
  else if (domain.includes('twitter.com') || domain.includes('facebook.com') ||
      domain.includes('reddit.com') || domain.includes('youtube.com') ||
      domain.includes('instagram.com') || domain.includes('tiktok.com') ||
      domain.includes('blog') || domain.includes('forum')) {
    baseScore = 30;
    sourceType = 'social-media';
    region = 'Global';
  }
  
  return { baseScore, domain: extractedDomain, region, sourceType };
}

// Legacy single-source function (kept for compatibility)
async function calculateReliabilityScore(url: string, supabaseClient: any): Promise<{
  baseScore: number;
  adjustedScore: number;
  domain: string;
  region: string;
  sourceType: string;
}> {
  const baseData = calculateBaseReliabilityScore(url);
  
  try {
    const { data, error } = await supabaseClient.rpc('get_adjusted_source_score', {
      _domain: baseData.domain,
      _base_score: baseData.baseScore
    });
    
    if (error) {
      console.error('Error getting adjusted score:', error);
      return { ...baseData, adjustedScore: baseData.baseScore };
    }
    
    return { ...baseData, adjustedScore: data || baseData.baseScore };
  } catch (err) {
    console.error('Error calling get_adjusted_source_score:', err);
    return { ...baseData, adjustedScore: baseData.baseScore };
  }
}

// Enhanced ML-powered category detection
interface CategoryMatch {
  category: string;
  displayName: string;
  confidence: number;
  matchedKeywords: string[];
  matchedPatterns: string[];
  criteria: any;
  weights: any;
  minSources: number;
  maxSourceAgeDays: number | null;
  requiredSourceTypes: string[];
}

async function detectContentCategory(
  content: string,
  supabaseClient: any
): Promise<CategoryMatch[]> {
  const lower = content.toLowerCase();
  const matches: CategoryMatch[] = [];
  
  try {
    // Get all active categories from database
    const { data: categories, error } = await supabaseClient
      .from('verification_categories')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    for (const category of categories || []) {
      let score = 0;
      const matchedKeywords: string[] = [];
      const matchedPatterns: string[] = [];
      
      // Check keywords
      const keywords = category.keywords as string[];
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          score += 10;
        }
      }
      
      // Check patterns (regex)
      const patterns = category.detection_patterns as string[];
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(content)) {
            matchedPatterns.push(pattern);
            score += 15;
          }
        } catch (err) {
          console.error('Invalid regex pattern:', pattern, err);
        }
      }
      
      // Calculate confidence (0-100)
      const confidence = Math.min(100, score);
      
      if (confidence > 20) {
        matches.push({
          category: category.name,
          displayName: category.display_name,
          confidence,
          matchedKeywords,
          matchedPatterns,
          criteria: category.verification_criteria,
          weights: category.confidence_weights,
          minSources: category.min_sources || 3,
          maxSourceAgeDays: category.max_source_age_days,
          requiredSourceTypes: category.required_source_types || []
        });
      }
    }
    
    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);
    
    return matches;
  } catch (err) {
    console.error('Error in detectContentCategory:', err);
    return [];
  }
}

/**
 * Detect the geographic region of a source based on domain
 */
function detectSourceRegion(domain: string): string {
  const lowerDomain = domain.toLowerCase();
  
  // North America - Major US outlets and .com/.us/.ca
  const northAmericaDomains = [
    'nytimes.com', 'cnn.com', 'reuters.com', 'apnews.com', 'npr.org',
    'washingtonpost.com', 'foxnews.com', 'nbcnews.com', 'abcnews.go.com',
    'cbsnews.com', 'usatoday.com', 'wsj.com', 'politico.com', 'thehill.com',
    'latimes.com', 'nypost.com', 'newsweek.com', 'time.com', 'fortune.com',
    'bloomberg.com', 'cnbc.com', 'forbes.com', 'businessinsider.com',
    'huffpost.com', 'vox.com', 'slate.com', 'salon.com', 'theatlantic.com',
    'newyorker.com', 'propublica.org', 'factcheck.org', 'politifact.com',
    'snopes.com', 'truthorfiction.com', 'cbc.ca', 'globalnews.ca'
  ];
  
  // Europe - Major European outlets and TLDs
  const europeDomains = [
    'bbc.com', 'bbc.co.uk', 'theguardian.com', 'independent.co.uk',
    'telegraph.co.uk', 'dailymail.co.uk', 'thetimes.co.uk', 'ft.com',
    'economist.com', 'euronews.com', 'dw.com', 'france24.com', 'rfi.fr',
    'lemonde.fr', 'lefigaro.fr', 'spiegel.de', 'zeit.de', 'elpais.com',
    'elmundo.es', 'corriere.it', 'repubblica.it', 'ansa.it', 'rtve.es',
    'rte.ie', 'thejournal.ie', 'nos.nl', 'svt.se', 'dr.dk', 'nrk.no'
  ];
  
  // Africa - African outlets and TLDs
  const africaDomains = [
    'businessday.ng', 'completesports.com', 'premiumtimesng.com',
    'punchng.com', 'vanguardngr.com', 'thenationonlineng.net',
    'dailytrust.com.ng', 'guardian.ng', 'news24.com', 'iol.co.za',
    'timeslive.co.za', 'mg.co.za', 'dailymaverick.co.za',
    'nation.co.ke', 'standardmedia.co.ke', 'businessdailyafrica.com',
    'theeastafrican.co.ke', 'africanews.com'
  ];
  
  // Asia Pacific - Asian outlets and TLDs
  const asiaPacificDomains = [
    'aljazeera.com', 'scmp.com', 'straitstimes.com', 'channelnewsasia.com',
    'japantimes.co.jp', 'asahi.com', 'mainichi.jp', 'yomiuri.co.jp',
    'thehindu.com', 'hindustantimes.com', 'indianexpress.com', 'timesofindia.com',
    'dawn.com', 'thenews.com.pk', 'smh.com.au', 'abc.net.au', 'news.com.au',
    'nzherald.co.nz', 'stuff.co.nz', 'bangkokpost.com', 'nationthailand.com',
    'todayonline.com', 'koreaherald.com', 'koreatimes.co.kr'
  ];
  
  // Latin America - Latin American outlets and TLDs
  const latinAmericaDomains = [
    'folha.uol.com.br', 'globo.com', 'estadao.com.br', 'uol.com.br',
    'clarin.com', 'lanacion.com.ar', 'pagina12.com.ar', 'infobae.com',
    'eluniversal.com.mx', 'reforma.com', 'jornada.com.mx', 'milenio.com',
    'eltiempo.com', 'semana.com', 'elespectador.com', 'latercera.com',
    'emol.com', 'elmercurio.com', 'elpais.com.uy', 'elobservador.com.uy'
  ];
  
  // Middle East - Middle Eastern outlets and TLDs
  const middleEastDomains = [
    'alarabiya.net', 'aljazeera.net', 'arabnews.com', 'gulfnews.com',
    'khaleejtimes.com', 'thenational.ae', 'gulf-times.com', 'dohanews.co',
    'haaretz.com', 'timesofisrael.com', 'jpost.com', 'ynetnews.com',
    'turkishminute.com', 'hurriyetdailynews.com', 'dailysabah.com'
  ];
  
  // Check known domains first
  if (northAmericaDomains.some(d => lowerDomain.includes(d))) return 'North America';
  if (europeDomains.some(d => lowerDomain.includes(d))) return 'Europe';
  if (africaDomains.some(d => lowerDomain.includes(d))) return 'Africa';
  if (asiaPacificDomains.some(d => lowerDomain.includes(d))) return 'Asia Pacific';
  if (latinAmericaDomains.some(d => lowerDomain.includes(d))) return 'Latin America';
  if (middleEastDomains.some(d => lowerDomain.includes(d))) return 'Middle East';
  
  // TLD-based detection
  if (lowerDomain.endsWith('.com') || lowerDomain.endsWith('.us') || lowerDomain.endsWith('.ca')) {
    return 'North America';
  }
  if (lowerDomain.endsWith('.uk') || lowerDomain.endsWith('.eu') || lowerDomain.endsWith('.de') || 
      lowerDomain.endsWith('.fr') || lowerDomain.endsWith('.es') || lowerDomain.endsWith('.it') ||
      lowerDomain.endsWith('.nl') || lowerDomain.endsWith('.se') || lowerDomain.endsWith('.no') ||
      lowerDomain.endsWith('.dk') || lowerDomain.endsWith('.fi') || lowerDomain.endsWith('.ie')) {
    return 'Europe';
  }
  if (lowerDomain.endsWith('.ng') || lowerDomain.endsWith('.za') || lowerDomain.endsWith('.ke') ||
      lowerDomain.endsWith('.gh') || lowerDomain.endsWith('.tz') || lowerDomain.endsWith('.ug') ||
      lowerDomain.endsWith('.et') || lowerDomain.endsWith('.eg')) {
    return 'Africa';
  }
  if (lowerDomain.endsWith('.jp') || lowerDomain.endsWith('.cn') || lowerDomain.endsWith('.au') ||
      lowerDomain.endsWith('.in') || lowerDomain.endsWith('.sg') || lowerDomain.endsWith('.kr') ||
      lowerDomain.endsWith('.th') || lowerDomain.endsWith('.my') || lowerDomain.endsWith('.nz') ||
      lowerDomain.endsWith('.ph') || lowerDomain.endsWith('.vn') || lowerDomain.endsWith('.id')) {
    return 'Asia Pacific';
  }
  if (lowerDomain.endsWith('.br') || lowerDomain.endsWith('.mx') || lowerDomain.endsWith('.ar') ||
      lowerDomain.endsWith('.cl') || lowerDomain.endsWith('.co') || lowerDomain.endsWith('.pe') ||
      lowerDomain.endsWith('.ve') || lowerDomain.endsWith('.uy')) {
    return 'Latin America';
  }
  if (lowerDomain.endsWith('.ae') || lowerDomain.endsWith('.sa') || lowerDomain.endsWith('.il') ||
      lowerDomain.endsWith('.qa') || lowerDomain.endsWith('.kw') || lowerDomain.endsWith('.tr')) {
    return 'Middle East';
  }
  
  // Default to International for truly global/unknown sources
  return 'International';
}

// Legacy simple categorization (fallback)
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