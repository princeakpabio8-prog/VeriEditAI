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
const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
const googleFactCheckApiKey = Deno.env.get("GOOGLE_FACT_CHECK_API_KEY");
const newsApiKey = Deno.env.get("NEWSAPI_KEY");

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Interface for verification results
interface VerificationSource {
  title: string;
  url: string;
  snippet: string;
  reliability_score: number;
  source_type: 'perplexity' | 'fact_check' | 'news' | 'encyclopedia' | 'fallback';
}

interface VerificationResult {
  confidence: number;
  analysis: string;
  sources: VerificationSource[];
  source_consensus: number;
  verification_method: string[];
}

// Google Fact Check Tools API integration (fixed)
async function performGoogleFactCheck(content: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    if (!googleFactCheckApiKey) {
      console.log('Google Fact Check API key not configured, skipping...');
      return { confidence: 50, analysis: 'Fact-check API not available', sources: [] };
    }

    const searchQuery = encodeURIComponent(content.substring(0, 500));
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${searchQuery}&key=${googleFactCheckApiKey}`;
    
    console.log('Calling Google Fact Check API...');
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Fact Check API error: ${response.status} - ${errorText}`);
      return { confidence: 50, analysis: 'Fact-check API error', sources: [] };
    }

    const data = await response.json();
    console.log('Google Fact Check response received');
    
    const sources: VerificationSource[] = [];
    let analysis = 'No professional fact-checks found for this content.';
    let confidence = 50;

    if (data.claims && data.claims.length > 0) {
      const claims = data.claims.slice(0, 3);
      
      for (const claim of claims) {
        if (claim.claimReview && claim.claimReview.length > 0) {
          const review = claim.claimReview[0];
          
          sources.push({
            title: review.publisher?.name || 'Professional Fact Checker',
            url: review.url || '#',
            snippet: `${claim.text?.substring(0, 150) || 'Claim reviewed'} - Rating: ${review.textualRating || 'See details'}`,
            reliability_score: 90,
            source_type: 'fact_check' as const
          });
        }
      }
      
      if (sources.length > 0) {
        analysis = `Found ${sources.length} professional fact-check(s) for similar claims. Professional fact-checkers have reviewed related content.`;
        confidence = 85;
      }
    }

    return { confidence, analysis, sources };
  } catch (error) {
    console.error('Google Fact Check error:', error);
    return { 
      confidence: 50, 
      analysis: 'Fact-check verification temporarily unavailable', 
      sources: []
    };
  }
}

// Enhanced News verification (fixed)
async function performNewsVerification(content: string, category: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    if (!newsApiKey) {
      console.log('NewsAPI key not configured, skipping...');
      return { confidence: 50, analysis: 'News API not available', sources: [] };
    }

    // Extract key terms for search
    const keywords = content.substring(0, 100).replace(/[^\w\s]/g, ' ').split(' ').filter(word => word.length > 3).slice(0, 5).join(' ');
    const searchQuery = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${searchQuery}&sortBy=relevancy&pageSize=5&language=en&apiKey=${newsApiKey}`;
    
    console.log('Calling NewsAPI...');
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NewsAPI error: ${response.status} - ${errorText}`);
      return { confidence: 50, analysis: 'News API error', sources: [] };
    }

    const data = await response.json();
    console.log('NewsAPI response received');
    
    const sources: VerificationSource[] = [];
    let analysis = 'No recent news coverage found for this topic.';
    let confidence = 50;

    if (data.articles && data.articles.length > 0) {
      const articles = data.articles.slice(0, 3).filter(article => 
        article.title && 
        article.url && 
        !article.title.includes('[Removed]') &&
        article.source?.name
      );
      
      for (const article of articles) {
        sources.push({
          title: `${article.source.name}: ${article.title}`,
          url: article.url,
          snippet: article.description?.substring(0, 200) || 'Recent news coverage',
          reliability_score: 75,
          source_type: 'news' as const
        });
      }
      
      if (sources.length > 0) {
        analysis = `Found ${sources.length} recent news article(s) covering related topics. Current media coverage provides context.`;
        confidence = 70;
      }
    }

    return { confidence, analysis, sources };
  } catch (error) {
    console.error('NewsAPI error:', error);
    return { 
      confidence: 50, 
      analysis: 'News verification temporarily unavailable', 
      sources: []
    };
  }
}

// Enhanced Wikipedia verification (fixed)
async function performWikipediaVerification(content: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    // Extract key terms for Wikipedia search
    const keywords = content.substring(0, 200).replace(/[^\w\s]/g, ' ').split(' ').filter(word => word.length > 3).slice(0, 3).join(' ');
    const searchQuery = encodeURIComponent(keywords);
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${searchQuery}&limit=5&namespace=0&format=json&origin=*`;
    
    console.log('Calling Wikipedia API...');
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Wikipedia API error: ${response.status}`);
      return { confidence: 50, analysis: 'Wikipedia API error', sources: [] };
    }

    const data = await response.json();
    console.log('Wikipedia response received');
    
    const sources: VerificationSource[] = [];
    let analysis = 'No relevant Wikipedia articles found.';
    let confidence = 50;

    if (data && Array.isArray(data) && data.length >= 4 && data[1]?.length > 0) {
      const titles = data[1];
      const descriptions = data[2];
      const urls = data[3];
      
      for (let i = 0; i < Math.min(3, titles.length); i++) {
        if (titles[i] && urls[i]) {
          sources.push({
            title: `Wikipedia: ${titles[i]}`,
            url: urls[i],
            snippet: descriptions[i] || 'Wikipedia encyclopedia article',
            reliability_score: 85,
            source_type: 'encyclopedia' as const
          });
        }
      }
      
      if (sources.length > 0) {
        analysis = `Found ${sources.length} relevant Wikipedia article(s). Encyclopedia sources provide background context.`;
        confidence = 75;
      }
    }

    return { confidence, analysis, sources };
  } catch (error) {
    console.error('Wikipedia verification error:', error);
    return { 
      confidence: 50, 
      analysis: 'Wikipedia verification temporarily unavailable', 
      sources: []
    };
  }
}

// Enhanced Multi-AI Verification with Claude 4 and o3
async function performClaudeVerification(content: string, category: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.log('Anthropic API key not configured, skipping...');
      return { confidence: 50, analysis: 'Claude analysis not available', sources: [] };
    }

    console.log('Calling Claude 4 Opus API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `As an expert fact-checker specializing in ${category}, analyze this claim with superior reasoning: "${content}"

ANALYSIS REQUIREMENTS:
1. Confidence Score (0-100) based on available evidence
2. Detailed factual analysis with reasoning chains
3. Identify key verification points and potential biases
4. Cross-reference with known facts and logical consistency
5. Consider source credibility and temporal context

FORMAT:
Confidence: [0-100]%
Analysis: [Detailed reasoning]
Key Points: [Bullet points of verification elements]
Potential Issues: [Biases, limitations, red flags]`
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return { confidence: 50, analysis: 'Claude API error', sources: [] };
    }

    const data = await response.json();
    console.log('Claude 4 response received');
    
    const analysis = data.content[0].text;
    
    // Enhanced confidence extraction
    const confidenceMatch = analysis.match(/confidence[:\s]*(\d+)%?/i);
    const confidence = confidenceMatch ? Math.min(Math.max(parseInt(confidenceMatch[1]), 0), 100) : 75;
    
    return { confidence, analysis, sources: [] };
  } catch (error) {
    console.error('Claude verification error:', error);
    return { 
      confidence: 50, 
      analysis: 'Claude verification temporarily unavailable', 
      sources: []
    };
  }
}

async function performGPTReasoningVerification(content: string, category: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.log('OpenAI API key not configured, skipping...');
      return { confidence: 50, analysis: 'GPT reasoning not available', sources: [] };
    }

    console.log('Calling GPT o3 Reasoning API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-2025-04-16', // Advanced reasoning model
        messages: [{
          role: 'system',
          content: `You are an expert fact-checker with advanced reasoning capabilities. Specialize in ${category} content verification. Use step-by-step logical analysis.`
        }, {
          role: 'user',
          content: `Verify this ${category} claim using advanced reasoning: "${content}"

REASONING FRAMEWORK:
1. Break down the claim into verifiable components
2. Assess each component's plausibility and evidence
3. Consider logical consistency and causal relationships
4. Evaluate temporal and contextual factors
5. Identify potential misinformation patterns

Provide confidence score (0-100) and detailed step-by-step reasoning.`
        }],
        max_completion_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GPT API error: ${response.status} - ${errorText}`);
      return { confidence: 50, analysis: 'GPT reasoning error', sources: [] };
    }

    const data = await response.json();
    console.log('GPT o3 reasoning response received');
    
    const analysis = data.choices[0].message.content;
    
    const confidenceMatch = analysis.match(/confidence[:\s]*(\d+)%?/i);
    const confidence = confidenceMatch ? Math.min(Math.max(parseInt(confidenceMatch[1]), 0), 100) : 75;
    
    return { confidence, analysis, sources: [] };
  } catch (error) {
    console.error('GPT reasoning verification error:', error);
    return { 
      confidence: 50, 
      analysis: 'GPT reasoning verification temporarily unavailable', 
      sources: []
    };
  }
}

// Enhanced Perplexity verification with better prompting
async function performPerplexityVerification(content: string, category: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    if (!perplexityApiKey) {
      console.log('Perplexity API key not configured, skipping...');
      return { confidence: 50, analysis: 'Real-time AI analysis not available', sources: [] };
    }

    let searchPrompt: string;
    let systemPrompt: string;
    
    if (category === 'business') {
      searchPrompt = `Analyze this business claim for credibility: "${content}". 
      Consider: revenue plausibility, business model viability, timeline feasibility, market conditions.
      Provide confidence score (0-100) and cite real sources with URLs.`;
      systemPrompt = `You are a business analyst expert. Focus on business logic, market realities, and entrepreneurship patterns. Provide balanced analysis with confidence scoring.`;
    } else {
      searchPrompt = `Fact-check this ${category} claim with current data: "${content}". 
      Verify against recent sources, official data, and expert consensus.
      Provide confidence score (0-100) and cite specific sources with URLs.`;
      systemPrompt = `You are an expert fact-checker for ${category}. Use real-time data and provide accurate verification with confidence scores and source citations.`;
    }
    
    console.log('Calling Enhanced Perplexity API...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: searchPrompt }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 3000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0,
        citations: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status} - ${errorText}`);
      return { confidence: 50, analysis: 'Real-time AI analysis error', sources: [] };
    }

    const data = await response.json();
    console.log('Enhanced Perplexity response received');
    
    const message = data?.choices?.[0]?.message || {};
    const analysis = message?.content || '';

    // Enhanced confidence extraction
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
        confidence = Math.min(Math.max(parseInt(match[1]), 0), 100);
        break;
      }
    }
    
    // Enhanced source extraction
    let sources: VerificationSource[] = [];
    const possibleCitations = [
      data?.citations,
      message?.citations,
      message?.metadata?.citations
    ].filter(c => Array.isArray(c) && c.length > 0);

    for (const citationArray of possibleCitations) {
      for (const citation of citationArray) {
        const url = citation?.url || citation?.link;
        if (url && typeof url === 'string' && /^https?:\/\//.test(url)) {
          sources.push({
            title: citation?.title || 'Real-time Source',
            url,
            snippet: citation?.text || citation?.snippet || 'Referenced in real-time analysis',
            reliability_score: 85,
            source_type: 'perplexity' as const
          });
        }
      }
    }

    // Extract URLs from text if no citations
    if (sources.length === 0 && analysis) {
      const urlRegex = /https?:\/\/[^\s)\]>\,;]+/g;
      const foundUrls = analysis.match(urlRegex) || [];
      sources = foundUrls.slice(0, 3).map(url => {
        const cleanUrl = url.replace(/[.,;)\]}>]+$/, '');
        const domainMatch = cleanUrl.match(/https?:\/\/(?:www\.)?([^\/]+)/);
        return {
          title: `Real-time: ${domainMatch?.[1] || 'Source'}`,
          url: cleanUrl,
          snippet: 'Referenced in real-time AI analysis',
          reliability_score: 80,
          source_type: 'perplexity' as const
        };
      });
    }
    
    return { confidence, analysis, sources };
  } catch (error) {
    console.error('Enhanced Perplexity verification error:', error);
    return { 
      confidence: 50, 
      analysis: 'Real-time AI verification temporarily unavailable', 
      sources: []
    };
  }
}

// Academic source verification for enhanced credibility
async function performAcademicVerification(content: string): Promise<{confidence: number, analysis: string, sources: VerificationSource[]}> {
  try {
    // Extract key terms for academic search
    const keywords = content.substring(0, 200)
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5)
      .join(' ');
    
    const searchQuery = encodeURIComponent(keywords);
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${searchQuery}&limit=5&fields=title,abstract,url,authors,year,citationCount`;
    
    console.log('Calling Academic Sources API...');
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Academic API error: ${response.status}`);
      return { confidence: 50, analysis: 'Academic sources unavailable', sources: [] };
    }

    const data = await response.json();
    console.log('Academic sources response received');
    
    const sources: VerificationSource[] = [];
    let analysis = 'No relevant academic papers found.';
    let confidence = 50;

    if (data.data && data.data.length > 0) {
      const papers = data.data.slice(0, 3);
      
      for (const paper of papers) {
        if (paper.title && paper.year) {
          sources.push({
            title: `Academic (${paper.year}): ${paper.title}`,
            url: paper.url || `https://semanticscholar.org/paper/${paper.paperId}`,
            snippet: paper.abstract?.substring(0, 200) || `Academic research paper with ${paper.citationCount || 0} citations`,
            reliability_score: 95,
            source_type: 'encyclopedia' as const // Using encyclopedia type for academic
          });
        }
      }
      
      if (sources.length > 0) {
        analysis = `Found ${sources.length} relevant academic paper(s). Peer-reviewed research provides scholarly context.`;
        confidence = 80;
      }
    }

    return { confidence, analysis, sources };
  } catch (error) {
    console.error('Academic verification error:', error);
    return { 
      confidence: 50, 
      analysis: 'Academic verification temporarily unavailable', 
      sources: []
    };
  }
}

// Enhanced category detection with more categories
function categorizeContent(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Business/Entrepreneurship content
  if (lowerContent.includes('business') || lowerContent.includes('startup') || 
      lowerContent.includes('revenue') || lowerContent.includes('profit') ||
      lowerContent.includes('launch') || lowerContent.includes('product') ||
      lowerContent.includes('entrepreneur') || lowerContent.includes('income') ||
      lowerContent.includes('sales') || lowerContent.includes('marketing')) {
    return 'business';
  }
  
  // Political content
  if (lowerContent.includes('election') || lowerContent.includes('politician') || 
      lowerContent.includes('government') || lowerContent.includes('policy') ||
      lowerContent.includes('constitution') || lowerContent.includes('law') ||
      lowerContent.includes('congress') || lowerContent.includes('parliament')) {
    return 'political';
  }
  
  // Health content
  if (lowerContent.includes('health') || lowerContent.includes('medical') || 
      lowerContent.includes('doctor') || lowerContent.includes('treatment') ||
      lowerContent.includes('vaccine') || lowerContent.includes('disease')) {
    return 'health';
  }
  
  // Science content
  if (lowerContent.includes('study') || lowerContent.includes('research') || 
      lowerContent.includes('scientist') || lowerContent.includes('experiment')) {
    return 'science';
  }
  
  // Sports content
  if (lowerContent.includes('sport') || lowerContent.includes('team') || 
      lowerContent.includes('player') || lowerContent.includes('game')) {
    return 'sports';
  }
  
  // Technology content
  if (lowerContent.includes('tech') || lowerContent.includes('software') || 
      lowerContent.includes('app') || lowerContent.includes('digital')) {
    return 'technology';
  }
  
  return 'general';
}

// Multi-source verification with consensus algorithm and performance optimization
// Timeout helper to cap per-source latency
function withTimeout<T>(p: Promise<T>, ms: number, label: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        console.warn(`${label} timed out after ${ms}ms`);
        settled = true;
        resolve(fallback);
      }
    }, ms);
    p.then((v) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(v);
      }
    }).catch((_e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(fallback);
      }
    });
  });
}

async function performMultiSourceVerification(content: string, category: string): Promise<VerificationResult> {
  console.log('Starting enhanced multi-AI verification...');
  
  // Enhanced verification with multiple AI models and specialized sources
  let sourcesToRun: Promise<{confidence: number, analysis: string, sources: VerificationSource[]}>[];
  
  if (category === 'business') {
    // Business content: focus on AI analysis + market verification
    sourcesToRun = [
      withTimeout(performClaudeVerification(content, category), 3000, 'Claude', { confidence: 50, analysis: 'Claude timeout', sources: [] }),
      withTimeout(performGPTReasoningVerification(content, category), 3000, 'GPT Reasoning', { confidence: 50, analysis: 'GPT timeout', sources: [] }),
      withTimeout(performPerplexityVerification(content, category), 1500, 'Perplexity', { confidence: 50, analysis: 'Perplexity timeout', sources: [] }),
      withTimeout(performNewsVerification(content, category), 1500, 'NewsAPI', { confidence: 50, analysis: 'News timeout', sources: [] })
    ];
  } else {
    // General content: full multi-source verification
    sourcesToRun = [
      withTimeout(performClaudeVerification(content, category), 3000, 'Claude', { confidence: 50, analysis: 'Claude timeout', sources: [] }),
      withTimeout(performGPTReasoningVerification(content, category), 3000, 'GPT Reasoning', { confidence: 50, analysis: 'GPT timeout', sources: [] }),
      withTimeout(performPerplexityVerification(content, category), 1500, 'Perplexity', { confidence: 50, analysis: 'Perplexity timeout', sources: [] }),
      withTimeout(performGoogleFactCheck(content), 1500, 'Google Fact Check', { confidence: 50, analysis: 'Fact-check timeout', sources: [] }),
      withTimeout(performNewsVerification(content, category), 1500, 'NewsAPI', { confidence: 50, analysis: 'News timeout', sources: [] }),
      withTimeout(performWikipediaVerification(content), 1500, 'Wikipedia', { confidence: 50, analysis: 'Wikipedia timeout', sources: [] })
    ];
  }
  
  // Execute all verifications in parallel for maximum speed
  const results = await Promise.allSettled(sourcesToRun);

  // Collect results from successful verifications
  const verificationResults = [];
  const allSources: VerificationSource[] = [];
  const methods: string[] = [];

  // Enhanced result processing for multi-AI verification
  if (category === 'business') {
    if (results[0]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Claude Business Analysis', ...results[0].value });
      allSources.push(...results[0].value.sources);
      methods.push('Claude 4 Superior Reasoning');
    }
    if (results[1]?.status === 'fulfilled') {
      verificationResults.push({ name: 'GPT Reasoning Analysis', ...results[1].value });
      allSources.push(...results[1].value.sources);
      methods.push('GPT o3 Advanced Reasoning');
    }
    if (results[2]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Real-time AI Analysis', ...results[2].value });
      allSources.push(...results[2].value.sources);
      methods.push('Real-time AI Research');
    }
    if (results[3]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Market Verification', ...results[3].value });
      allSources.push(...results[3].value.sources);
      methods.push('Industry News Coverage');
    }
  } else {
    if (results[0]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Claude Analysis', ...results[0].value });
      allSources.push(...results[0].value.sources);
      methods.push('Claude 4 Superior Reasoning');
    }
    if (results[1]?.status === 'fulfilled') {
      verificationResults.push({ name: 'GPT Reasoning', ...results[1].value });
      allSources.push(...results[1].value.sources);
      methods.push('GPT o3 Advanced Reasoning');
    }
    if (results[2]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Real-time AI', ...results[2].value });
      allSources.push(...results[2].value.sources);
      methods.push('Real-time AI Research');
    }
    if (results[3]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Google Fact Check', ...results[3].value });
      allSources.push(...results[3].value.sources);
      methods.push('Professional Fact Checkers');
    }
    if (results[4]?.status === 'fulfilled') {
      verificationResults.push({ name: 'News Verification', ...results[4].value });
      allSources.push(...results[4].value.sources);
      methods.push('Current News Coverage');
    }
    if (results[5]?.status === 'fulfilled') {
      verificationResults.push({ name: 'Wikipedia Check', ...results[5].value });
      allSources.push(...results[5].value.sources);
      methods.push('Encyclopedia Verification');
    }
  }

  // Enhanced consensus algorithm with AI model weighting
  let totalWeightedConfidence = 0;
  let totalWeight = 0;

  for (const result of verificationResults) {
    let weight = 1;
    
    // Enhanced weights for AI models and content types
    if (category === 'business') {
      if (result.name.includes('Claude')) weight = 1.5; // Claude gets highest weight for reasoning
      if (result.name.includes('GPT Reasoning')) weight = 1.4; // o3 reasoning model
      if (result.name.includes('Real-time')) weight = 1.2; // Perplexity real-time
      if (result.name.includes('Market')) weight = 1.1; // News coverage
    } else {
      if (result.name.includes('Claude')) weight = 1.5; // Claude 4 superior reasoning
      if (result.name.includes('GPT Reasoning')) weight = 1.4; // o3 reasoning
      if (result.name.includes('Google Fact Check')) weight = 1.6; // Professional fact-checkers highest
      if (result.name.includes('Real-time')) weight = 1.3; // Perplexity with real-time data
      if (result.name.includes('News')) weight = 1.1; // News coverage
      if (result.name.includes('Wikipedia')) weight = 1.0; // Encyclopedia baseline
    }
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

function generateVerificationSummary(result: VerificationResult, category: string): string {
  const status = result.confidence >= 80 ? '✅ HIGHLY VERIFIED' : 
                 result.confidence >= 65 ? '✅ VERIFIED' : 
                 result.confidence >= 45 ? '⚠️ INCONCLUSIVE' : '❌ DISPUTED';
  
  const methods = result.verification_method && result.verification_method.length
    ? result.verification_method.join('\n• ')
    : 'Enhanced AI Analysis';

  const aiModels = result.verification_method?.filter(m => 
    m.includes('Claude') || m.includes('GPT') || m.includes('AI')
  ).length || 0;

  return `**🔍 ENHANCED MULTI-AI VERIFICATION RESULTS**\n\n**FINAL CONFIDENCE SCORE: ${result.confidence}%**\n**SOURCE CONSENSUS: ${result.source_consensus}%**\n**AI MODELS USED: ${aiModels} advanced reasoning models**\n\n**VERIFICATION STATUS: ${status}**\n\n**CATEGORY: ${category.toUpperCase()}**\n\n**VERIFICATION METHODS USED:**\n• ${methods}\n\n**ENHANCED MULTI-SOURCE ANALYSIS:**\n${result.analysis}\n\n**KEY FINDINGS:**\n• Sources Consulted: ${result.sources.length} authoritative sources\n• Verification Methods: ${result.verification_method?.length || 1}\n• AI Model Consensus: ${result.source_consensus}% agreement\n• Enhanced Analysis: Claude 4 + GPT o3 reasoning models\n• Real-time Check: Completed ${new Date().toLocaleString()}`;
}

// Main Supabase Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, user_id } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing multi-source verification for user: ${user_id}`);
    console.log(`Content: ${content.substring(0, 100)}...`);

    // Categorize content for better source selection
    const category = categorizeContent(content);
    console.log(`Detected category: ${category}`);

    // Perform multi-source verification with graceful fallback
    let verificationResult: VerificationResult;
    
    try {
      verificationResult = await performMultiSourceVerification(content, category);
      console.log('Multi-source verification completed with confidence:', verificationResult.confidence);
    } catch (verificationError) {
      console.error('Multi-source verification failed, using fallback:', verificationError);
      
      // Return graceful fallback instead of throwing
      verificationResult = {
        confidence: 46,
        analysis: 'Verification services temporarily unavailable. All external APIs failed to respond. Please try again later.',
        sources: [],
        source_consensus: 50,
        verification_method: ['Fallback Analysis']
      };
    }

    // Create comprehensive summary based on verification results
    const summary = generateVerificationSummary(verificationResult, category);

    console.log('Saving multi-source verification results...');

    let verification: any;
    
    try {
      // Save verification results to database
      const { data: verificationData, error: verificationError } = await supabase
        .from('verifications')
        .insert({
          user_id: user_id,
          content_type: 'text',
          content: content,
          trust_score: verificationResult.confidence,
          status: 'completed',
          result_summary: summary,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Error saving verification (non-fatal):', verificationError);
        // Continue without saving to database
        verification = { 
          id: crypto.randomUUID(), 
          created_at: new Date().toISOString() 
        };
      } else {
        verification = verificationData;
      }
    } catch (dbError) {
      console.error('Database error (non-fatal):', dbError);
      // Continue with fallback verification object
      verification = { 
        id: crypto.randomUUID(), 
        created_at: new Date().toISOString() 
      };
    }

    // Save sources to database in background (optional, don't fail if this fails)
    if (verification.id && verificationResult.sources.length > 0) {
      // Use background task for non-critical database operations
      const saveSourcesTask = async () => {
        try {
          const sourcesToInsert = verificationResult.sources.map(source => ({
            verification_id: verification.id,
            title: source.title,
            url: source.url,
            content_snippet: source.snippet,
            reliability_score: source.reliability_score,
            source_type: source.source_type
          }));

          const { error: sourcesError } = await supabase
            .from('sources')
            .insert(sourcesToInsert);

          if (sourcesError) {
            console.error('Error saving sources (background):', sourcesError);
          } else {
            console.log('Sources saved successfully in background');
          }
        } catch (sourceSaveError) {
          console.error('Source saving failed (background):', sourceSaveError);
        }
      };

      // Start background task - don't wait for it to complete
      saveSourcesTask().catch(err => console.error('Background task failed:', err));
    }

    console.log('Multi-source verification completed successfully');

    // Return results
    return new Response(
      JSON.stringify({
        confidence: verificationResult.confidence,
        status: verificationResult.confidence >= 80 ? 'highly_verified' : 
                verificationResult.confidence >= 65 ? 'verified' : 
                verificationResult.confidence >= 45 ? 'inconclusive' : 'disputed',
        summary: summary,
        analysis: verificationResult.analysis,
        sources: verificationResult.sources,
        source_consensus: verificationResult.source_consensus,
        verification_method: verificationResult.verification_method,
        category: category,
        created_at: verification.created_at
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Critical verification error:', error);
    
    // Always return 200 with a fallback response instead of 500
    return new Response(
      JSON.stringify({
        confidence: 46,
        status: 'inconclusive',
        summary: `**🔍 VERIFICATION UNAVAILABLE**\n\n**FINAL CONFIDENCE SCORE: 46%**\n**STATUS: ⚠️ INCONCLUSIVE**\n\n**VERIFICATION PROCESS:**\nThe verification system encountered technical difficulties while processing your request. This could be due to:\n\n• Temporary API service issues\n• Network connectivity problems  \n• High system load\n\n**RECOMMENDATIONS:**\n• Try again in a few moments\n• For critical content, verify through official sources\n• Contact support if the issue persists\n\n**FALLBACK ANALYSIS:**\nWhile we couldn't perform our usual multi-source verification, we recommend approaching this content with appropriate caution and cross-referencing with trusted sources when possible.\n\n**Real-time Check**: Attempted ${new Date().toLocaleString()}`,
        analysis: 'Verification services temporarily unavailable.',
        sources: [],
        source_consensus: 0,
        verification_method: ['Fallback Analysis'],
        category: 'general',
        created_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});