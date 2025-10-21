import { lower } from './string';

/**
 * Normalized verification result shape
 */
export interface NormalizedVerificationResult {
  confidence: number;
  status: string;
  summary: string;
  analysis: string;
  analysis_points?: string[]; // New: structured analysis bullets
  category: string;
  sources: Array<{
    title: string;
    url: string;
    content_snippet?: string;
    snippet?: string;
    full_content?: string;
    reliability_score?: number;
    source_type?: string;
  }>;
  methods?: string[];
  sourceConsensus?: number;
  processingTime?: number;
  created_at?: string;
  verificationId?: string | null;
  fromCache?: boolean;
  fromEnhancedCache?: boolean;
  fromLocalFallback?: boolean;
}

let diagnosticLogged = false;

/**
 * Normalizes verification result data to prevent runtime errors
 * Ensures all fields have safe, consistent types
 */
export function normalizeVerifyResult(raw: any): NormalizedVerificationResult {
  if (!raw || typeof raw !== 'object') {
    console.error('normalizeVerifyResult: Invalid input (not an object):', raw);
    return createDefaultResult();
  }

  // Log unexpected types once per session for debugging
  if (!diagnosticLogged) {
    const issues: string[] = [];
    if (raw.status !== undefined && typeof raw.status !== 'string') {
      issues.push(`status: ${typeof raw.status}`);
    }
    if (raw.category !== undefined && typeof raw.category !== 'string') {
      issues.push(`category: ${typeof raw.category}`);
    }
    if (raw.confidence !== undefined && typeof raw.confidence !== 'number') {
      issues.push(`confidence: ${typeof raw.confidence}`);
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Verification result type issues detected:', issues.join(', '));
      diagnosticLogged = true;
    }
  }

  // Normalize confidence to number
  let confidence = 0;
  if (typeof raw.confidence === 'number' && !isNaN(raw.confidence)) {
    confidence = Math.max(0, Math.min(100, raw.confidence));
  } else if (typeof raw.confidence === 'string') {
    const parsed = parseFloat(raw.confidence);
    confidence = !isNaN(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
  }

  // Normalize string fields with lower - ensure never undefined
  let status = lower(raw.status) || lower(raw.verification_status) || 'unknown';

  // Normalize category, summary, analysis first
  const category = lower(raw.category) || 'general';
  const summary = typeof raw.summary === 'string' ? raw.summary : 'No summary available';
  const analysis = typeof raw.analysis === 'string' ? raw.analysis : summary;

  // Heuristic override: if summary/analysis clearly indicate refutation, mark as debunked
  // This fixes cases where upstream set status by confidence alone but the narrative refutes the claim
  if (status !== 'debunked' && status !== 'false') {
    const combined = (summary + ' ' + analysis).toLowerCase();
    const refuteHints = ['debunked', 'false claim', 'not true', 'no evidence', 'has not', 'did not', 'does not'];
    if (['verified', 'likely_accurate', 'inconclusive', 'disputed', 'highly_verified'].includes(status) &&
        refuteHints.some(h => combined.includes(h))) {
      status = 'debunked';
    }
  }

  // Normalize sources array
  const sources = Array.isArray(raw.sources) 
    ? raw.sources.map((s: any) => normalizeSingleSource(s))
    : [];

  // Normalize optional fields
  const methods = Array.isArray(raw.methods) 
    ? raw.methods.filter((m: any) => typeof m === 'string')
    : undefined;

  const sourceConsensus = typeof raw.sourceConsensus === 'number' 
    ? raw.sourceConsensus 
    : undefined;

  const processingTime = typeof raw.processingTime === 'number' 
    ? raw.processingTime 
    : undefined;

  const created_at = typeof raw.created_at === 'string' 
    ? raw.created_at 
    : new Date().toISOString();

  const verificationId = typeof raw.verificationId === 'string' 
    ? raw.verificationId 
    : null;

  // Handle analysis_points (new structured format)
  const analysis_points = Array.isArray(raw.analysis_points) 
    ? raw.analysis_points.filter((p: any) => typeof p === 'string')
    : undefined;

  return {
    confidence,
    status,
    summary,
    analysis,
    analysis_points,
    category,
    sources,
    methods,
    sourceConsensus,
    processingTime,
    created_at,
    verificationId,
    fromCache: raw.fromCache === true,
    fromEnhancedCache: raw.fromEnhancedCache === true,
    fromLocalFallback: raw.fromLocalFallback === true,
  };
}

/**
 * Normalize a single source object
 */
function normalizeSingleSource(s: any): NormalizedVerificationResult['sources'][0] {
  if (!s || typeof s !== 'object') {
    return {
      title: 'Unknown Source',
      url: '#',
      content_snippet: '',
    };
  }

  const title = typeof s.title === 'string' ? s.title : 'Unknown Source';
  const url = typeof s.url === 'string' ? s.url : '#';
  const content_snippet = typeof s.content_snippet === 'string' 
    ? s.content_snippet 
    : typeof s.snippet === 'string' 
      ? s.snippet 
      : '';
  
  const full_content = typeof s.full_content === 'string'
    ? s.full_content
    : typeof s.content === 'string'
      ? s.content
      : content_snippet;
  
  const reliability_score = typeof s.reliability_score === 'number' 
    ? s.reliability_score 
    : undefined;

  const source_type = typeof s.source_type === 'string' 
    ? s.source_type 
    : undefined;

  return {
    title,
    url,
    content_snippet,
    snippet: content_snippet, // Keep both for compatibility
    full_content,
    reliability_score,
    source_type,
  };
}

/**
 * Create a default/fallback result
 */
function createDefaultResult(): NormalizedVerificationResult {
  return {
    confidence: 0,
    status: 'unknown',
    summary: 'Verification result unavailable',
    analysis: 'Unable to process verification result',
    category: 'general',
    sources: [],
    created_at: new Date().toISOString(),
  };
}
