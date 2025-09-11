// Supabase Edge Function: /verify (Lite Mode)
// Fast verification using Wikipedia + heuristics (no API keys required)

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fast Wikipedia verification (no auth required)
async function quickWikipediaCheck(content: string): Promise<any> {
  try {
    const keywords = content.substring(0, 200)
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
    
    const searchQuery = encodeURIComponent(keywords);
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${searchQuery}&limit=3&namespace=0&format=json&origin=*`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { confidence: 50, analysis: 'Wikipedia search failed', sources: [] };
    }

    const data = await response.json();
    
    if (data && Array.isArray(data) && data.length >= 4 && data[1]?.length > 0) {
      const titles = data[1];
      const descriptions = data[2];
      const urls = data[3];
      
      const sources = titles.slice(0, 2).map((title: string, i: number) => ({
        title: `Wikipedia: ${title}`,
        url: urls[i] || '#',
        snippet: descriptions[i] || 'Wikipedia encyclopedia article',
        reliability_score: 85,
        source_type: 'encyclopedia'
      }));
      
      return {
        confidence: 75,
        analysis: `Found ${sources.length} Wikipedia article(s) providing context. Encyclopedia sources offer reliable background information.`,
        sources
      };
    }
    
    return { confidence: 60, analysis: 'No Wikipedia articles found for this topic.', sources: [] };
  } catch (error) {
    return { confidence: 50, analysis: 'Wikipedia search timed out', sources: [] };
  }
}

// Content analysis using heuristics (no APIs required)
function analyzeContentHeuristics(content: string): any {
  const text = content.toLowerCase();
  let confidence = 70; // Start with neutral
  let flags = [];
  let signals = [];
  
  // Positive signals
  if (text.includes('according to') || text.includes('study shows') || text.includes('research indicates')) {
    confidence += 10;
    signals.push('Contains source references');
  }
  
  if (text.includes('university') || text.includes('professor') || text.includes('journal')) {
    confidence += 8;
    signals.push('Academic context mentioned');
  }
  
  if (/\d{4}/.test(text)) { // Contains years
    confidence += 5;
    signals.push('Includes temporal context');
  }
  
  // Warning signals
  if (text.includes('breaking:') || text.includes('urgent:') || text.includes('shocking')) {
    confidence -= 15;
    flags.push('Sensational language detected');
  }
  
  if (text.includes('they don\'t want you to know') || text.includes('secret') || text.includes('conspiracy')) {
    confidence -= 20;
    flags.push('Conspiracy-like language');
  }
  
  if (text.includes('100%') || text.includes('guaranteed') || text.includes('proven fact')) {
    confidence -= 10;
    flags.push('Absolute claims detected');
  }
  
  // Length and structure analysis
  if (content.length < 50) {
    confidence -= 10;
    flags.push('Very short content');
  } else if (content.length > 500) {
    confidence += 5;
    signals.push('Substantial content provided');
  }
  
  // Final bounds
  confidence = Math.min(Math.max(confidence, 20), 90);
  
  const analysis = [
    `Content analysis completed using linguistic patterns.`,
    signals.length > 0 ? `Positive indicators: ${signals.join(', ')}` : '',
    flags.length > 0 ? `Warning signs: ${flags.join(', ')}` : '',
    `Content length: ${content.length} characters`
  ].filter(Boolean).join(' ');
  
  return { confidence, analysis, flags, signals };
}

// Category detection
function detectCategory(content: string): string {
  const text = content.toLowerCase();
  
  if (text.includes('health') || text.includes('medical') || text.includes('vaccine') || text.includes('disease')) {
    return 'health';
  }
  if (text.includes('election') || text.includes('politician') || text.includes('government') || text.includes('policy')) {
    return 'political';
  }
  if (text.includes('business') || text.includes('startup') || text.includes('revenue') || text.includes('profit')) {
    return 'business';
  }
  if (text.includes('science') || text.includes('study') || text.includes('research') || text.includes('experiment')) {
    return 'science';
  }
  if (text.includes('climate') || text.includes('environment') || text.includes('global warming')) {
    return 'environment';
  }
  
  return 'general';
}

// Main lite verification function
async function performLiteVerification(content: string): Promise<any> {
  console.log('Starting Lite Mode verification...');
  const startTime = Date.now();
  
  // Run Wikipedia and heuristics in parallel
  const [wikipediaResult, heuristicsResult] = await Promise.allSettled([
    quickWikipediaCheck(content),
    Promise.resolve(analyzeContentHeuristics(content))
  ]);
  
  const wiki = wikipediaResult.status === 'fulfilled' ? wikipediaResult.value : { confidence: 50, analysis: 'Wikipedia unavailable', sources: [] };
  const heuristics = heuristicsResult.status === 'fulfilled' ? heuristicsResult.value : { confidence: 50, analysis: 'Analysis unavailable' };
  
  // Combine results with weighted average
  const combinedConfidence = Math.round((wiki.confidence * 0.6 + heuristics.confidence * 0.4));
  
  const category = detectCategory(content);
  const processingTime = Date.now() - startTime;
  
  const analysis = [
    `**Lite Mode Analysis**: ${heuristics.analysis}`,
    `**Wikipedia Research**: ${wiki.analysis}`
  ].join('\n\n');
  
  const status = combinedConfidence >= 75 ? '✅ LIKELY CREDIBLE' :
                 combinedConfidence >= 60 ? '⚠️ NEEDS VERIFICATION' :
                 combinedConfidence >= 40 ? '⚠️ QUESTIONABLE' : '❌ HIGH RISK';
  
  const summary = `**🔍 LITE MODE VERIFICATION**\n\n**CONFIDENCE SCORE: ${combinedConfidence}%**\n**STATUS: ${status}**\n**CATEGORY: ${category.toUpperCase()}**\n**PROCESSING TIME: ${processingTime}ms**\n\n**ANALYSIS METHODS:**\n• Content Heuristics Analysis\n• Wikipedia Context Search\n\n**DETAILED ANALYSIS:**\n${analysis}\n\n**KEY FINDINGS:**\n• Sources Found: ${wiki.sources?.length || 0} Wikipedia articles\n• Analysis Flags: ${heuristics.flags?.length || 0} warning signals\n• Positive Signals: ${heuristics.signals?.length || 0} credibility indicators\n• Fast Analysis: Completed in ${processingTime}ms\n\n**NOTE:** This is a lightweight verification. For comprehensive analysis, upgrade to use advanced AI models and fact-checking services.\n\n**Verified:** ${new Date().toLocaleString()}`;

  return {
    confidence: combinedConfidence,
    status: combinedConfidence >= 75 ? 'likely_credible' :
            combinedConfidence >= 60 ? 'needs_verification' :
            combinedConfidence >= 40 ? 'questionable' : 'high_risk',
    summary,
    analysis,
    sources: wiki.sources || [],
    source_consensus: Math.round((wiki.confidence + heuristics.confidence) / 2),
    verification_method: ['Content Heuristics', 'Wikipedia Research'],
    category,
    processing_time: processingTime,
    mode: 'lite',
    created_at: new Date().toISOString()
  };
}

// Main serve function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lite Mode verification for content: ${content.substring(0, 100)}...`);
    
    const result = await performLiteVerification(content);
    
    console.log(`Lite verification completed in ${result.processing_time}ms with confidence: ${result.confidence}%`);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Lite verification error:', error);
    
    return new Response(
      JSON.stringify({
        confidence: 45,
        status: 'error',
        summary: `**🔍 LITE MODE ERROR**\n\n**STATUS: ⚠️ ANALYSIS FAILED**\n\nThe lite verification system encountered an error. This could be due to:\n\n• Network connectivity issues\n• Content processing problems\n• Temporary service disruption\n\n**RECOMMENDATION:**\nTry again in a moment, or provide different content for analysis.\n\n**Error occurred:** ${new Date().toLocaleString()}`,
        analysis: 'Lite verification system temporarily unavailable',
        sources: [],
        source_consensus: 0,
        verification_method: ['Error Fallback'],
        category: 'general',
        processing_time: 0,
        mode: 'lite',
        created_at: new Date().toISOString(),
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});