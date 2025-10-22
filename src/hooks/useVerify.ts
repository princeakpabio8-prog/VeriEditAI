import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verificationCache } from '@/lib/verification-cache';
import { enhancedVerificationCache } from '@/lib/enhanced-verification-cache';
import { useEnhancedToast } from '@/components/enhanced-toast';
import { errorTracker, performanceMonitor } from '@/lib/error-tracking';
import { verificationAnalytics } from '@/lib/verification-analytics';
import { normalizeVerifyResult } from '@/lib/normalizers';

interface VerifyResult {
  confidence: number;
  status: string;
  summary: string;
  analysis?: string;
  sources: Array<{
    title: string;
    url: string;
    snippet?: string;
    reliability_score?: number;
  }>;
  source_consensus?: number;
  verification_method?: string[];
  category?: string;
  // Flags to indicate origin of the result
  fromCache?: boolean;
  fromEnhancedCache?: boolean;
  fromFallback?: boolean;
  originalError?: string;
  created_at: string;
  // NEW: Contradiction detection & version tracking
  contradictions?: Array<{
    claim_id: string;
    claim_text: string;
    confidence: number;
    reasoning: string;
    type: string;
  }>;
  related_claims?: Array<{
    claim_id: string;
    claim_text: string;
    similarity: number;
  }>;
}

// Local minimal fallback analysis to guarantee a result even if API fails
function localFallbackAnalysis(content: string, originalError?: string) {
  const safe = (content ?? '').toString();

  return {
    confidence: 50,
    status: 'inconclusive',
    summary: `Unable to verify: Network or API unavailable. Content analyzed: ${safe.length} characters.`,
    analysis: 'Verification requires external sources. Please try again when connected.',
    sources: [],
    source_consensus: 50,
    verification_method: ['Unavailable - Offline'],
    category: 'general',
    fromFallback: true,
    originalError,
    created_at: new Date().toISOString(),
  } as const;
}

export function useVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const { showCacheHit, showVerificationError } = useEnhancedToast();
  const inFlightKeys = useRef<Set<string>>(new Set());

  const verify = useCallback(async (content: string, userId: string, bypassCache = false, verificationData?: any): Promise<VerifyResult | null> => {
    let safeContent = (content ?? '').toString();
    
    // Pre-compact text content to prevent Tavily query length errors (400 char limit)
    if (verificationData?.contentType !== 'image' && verificationData?.contentType !== 'document') {
      // Strip URLs and "Source:" lines, then trim to ~280 chars for safety margin
      safeContent = safeContent
        .split('\n')
        .filter(line => !line.match(/^https?:\/\//) && !line.match(/^Source:/i))
        .join('\n')
        .trim();
      
      if (safeContent.length > 280) {
        safeContent = safeContent.substring(0, 280).trim();
        console.log('📏 Content pre-compacted to 280 chars for Tavily compatibility');
      }
    }
    
    const key = `${(userId ?? '').toString()}::${safeContent}`;
    const startTime = Date.now();

    // Prevent duplicate in-flight requests for the same content/user
    if (inFlightKeys.current.has(key)) {
      console.log('🚫 Duplicate verify request ignored for key:', key.substring(0, 30) + '...');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Guard against empty/invalid content
    if (!safeContent || safeContent.trim().length === 0) {
      const msg = 'Please provide content to verify.';
      console.warn('verify() called with empty content');
      setError(msg);
      showVerificationError(msg);
      setLoading(false);
      inFlightKeys.current.delete(key);
      return null;
    }

    try {
      performanceMonitor.startTiming('verification_process');
      // Check cache first (unless bypassed)
      if (!bypassCache) {
        const cachedResult = verificationCache.get(safeContent, userId);
        if (cachedResult) {
          const cacheAge = Math.round((Date.now() - (cachedResult.created_at ? new Date(cachedResult.created_at).getTime() : 0)) / 1000 / 60);
          console.log(`💾 Using cached verification result (${cacheAge} minutes old)`);
          
          // Track cache hit analytics
          verificationAnalytics.trackVerification({
            success: true,
            processingTime: Date.now() - startTime,
            confidence: cachedResult.confidence || 0,
            category: 'cached',
            userId
          });
          
          const normalized = normalizeVerifyResult({ ...(cachedResult as any), fromCache: true });
          setResult(normalized as any);
          showCacheHit('content');
          setLoading(false);
          return normalized as any;
        }

        // Check enhanced cache
        const enhancedCached = enhancedVerificationCache.get(safeContent, userId);
        if (enhancedCached) {
          console.log('🎯 Enhanced cache hit!');
          
          verificationAnalytics.trackVerification({
            success: true,
            processingTime: Date.now() - startTime,
            confidence: enhancedCached.confidence || 0,
            category: 'enhanced_cached',
            userId
          });
          
          const normalized = normalizeVerifyResult({ ...(enhancedCached as any), fromEnhancedCache: true });
          setResult(normalized as any);
          showCacheHit('content');
          setLoading(false);
          return normalized as any;
        }
      } else {
        console.log('⚡ Bypassing cache for fresh verification');
      }

      inFlightKeys.current.add(key);
      console.log('🚀 Calling verify edge function...');

      // Enhanced error handling with retry logic and exponential backoff
      let attemptCount = 0;
      const maxAttempts = 3;
      let lastError: any = null;

      while (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`📡 Verification attempt ${attemptCount}/${maxAttempts}`);

        try {
          const apiTimer = performanceMonitor.startTiming('tavily_api_call');
          
          // Detect device type using the same logic as use-mobile hook
          const userAgent = navigator.userAgent.toLowerCase();
          const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
          const isSmallScreen = window.innerWidth < 768;
          const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          const isTablet = /tablet|ipad/i.test(userAgent);
          
          let deviceType: 'mobile' | 'tablet' | 'desktop';
          if (isTablet) {
            deviceType = 'tablet';
          } else if (isSmallScreen || (hasTouch && isMobileUA)) {
            deviceType = 'mobile';
          } else {
            deviceType = 'desktop';
          }
          
          // Check if this is an image or document verification
          let functionName = 'verify';
          let requestBody: any = { 
            content: safeContent, 
            user_id: (userId ?? '').toString(),
            deviceType,
            verificationSource: verificationData?.source || 'web',
            sessionId: verificationData?.sessionId || crypto.randomUUID(),
            viralClaimId: verificationData?.viralClaimId || null
          };
          
          if (verificationData?.contentType === 'image') {
            functionName = 'image-verify';
            // Create a verification record first for image processing
            const { data: verificationRecord, error: verificationError } = await supabase
              .from('verifications')
              .insert({
                user_id: userId,
                content: verificationData.fileName || 'Image upload',
                content_type: 'image',
                file_name: verificationData.fileName,
                file_size: verificationData.fileSize,
                status: 'processing'
              })
              .select()
              .single();
            
            if (verificationError) {
              console.error('❌ Failed to create verification record:', {
                error: verificationError,
                message: verificationError.message,
                details: verificationError.details,
                hint: verificationError.hint,
                code: verificationError.code,
                userId,
                fileName: verificationData.fileName
              });
              throw new Error(`Database error: ${verificationError.message || 'Failed to create verification record'}`);
            }
            
            requestBody = {
              imageBase64: safeContent,
              verificationId: verificationRecord.id,
              userId: userId
            };
          } else if (verificationData?.contentType === 'document') {
            // For documents, content is already extracted text
            functionName = 'verify';
            requestBody = {
              content: safeContent,
              user_id: (userId ?? '').toString(),
              metadata: {
                fileName: verificationData.fileName,
                fileSize: verificationData.fileSize,
                documentMetadata: verificationData.metadata
              }
            };
          }
          
          const { data, error: fnError } = await supabase.functions.invoke(functionName, {
            body: requestBody
          });

          performanceMonitor.endTiming('tavily_api_call');

          if (fnError) {
            errorTracker.captureError(new Error(fnError.message || 'Unknown API error'));
            
            // Surface specific API errors to users
            let userFacingError = fnError.message || 'API Error';
            if (fnError.message?.includes('Query is too long')) {
              userFacingError = '🚫 Query Too Long\n\nPlease shorten your content and try again.';
            } else if (fnError.message?.includes('429') || fnError.message?.includes('Rate limit')) {
              userFacingError = '⏳ Rate Limited\n\nToo many requests. Please wait a moment and try again.';
            } else if (fnError.message?.includes('402') || fnError.message?.includes('Payment')) {
              userFacingError = '💳 Payment Required\n\nAPI credits exhausted. Please contact support.';
            }
            
            throw new Error(userFacingError);
          }

          if (!data) {
            throw new Error('No data received from verification service');
          }

          // Mobile diagnostics - log types before normalization
          const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (isMobile && data) {
            console.log('📱 Mobile pre-normalization check:', {
              statusType: typeof data.status,
              categoryType: typeof data.category,
              confidenceType: typeof data.confidence
            });
          }

          // Check for quota exceeded responses
          if (data.metadata?.quota_exceeded) {
            console.log('Quota exceeded response received');
            showVerificationError(`🚫 Verification Limit Reached\n\nYou've reached your monthly limit of ${data.metadata.limit || 5} verifications. Upgrade for unlimited access.`);
            setError('Verification limit exceeded. Please upgrade your plan.');
            
            // Normalize quota result to ensure safe types
            const quotaResult = normalizeVerifyResult(data);
            setResult(quotaResult as any);
            return quotaResult as any;
          }

          // Normalize IMMEDIATELY after receiving data - remove brittle pre-checks
          const normalizedData = normalizeVerifyResult(data) as VerifyResult;

          // Now validate the NORMALIZED data
          if (typeof normalizedData.confidence !== 'number' || !normalizedData.status || !normalizedData.summary) {
            console.warn('⚠️ Incomplete verification result after normalization:', normalizedData);
            throw new Error('Invalid verification result format');
          }

          const processingTime = Date.now() - startTime;
          try {
            performanceMonitor.endTiming('verification_process');
          } catch (error) {
            // Ignore performance monitoring errors
          }
          
          console.log(`✅ Verification successful in ${processingTime}ms`);
          console.log(`📊 Confidence: ${normalizedData.confidence}% | Status: ${normalizedData.status}`);

          // Track successful verification analytics
          verificationAnalytics.trackVerification({
            success: true,
            processingTime,
            confidence: normalizedData.confidence || 0,
            category: normalizedData.category || 'general',
            userId
          });

          setResult(normalizedData);

          // Cache the result in both caches (only if not bypassed)
          if (!bypassCache) {
            verificationCache.set(safeContent, userId, normalizedData);
            enhancedVerificationCache.set(safeContent, userId, normalizedData);
          }

          // Trigger background content analysis for sentiment & entities (fire and forget)
          if (verificationData?.contentType !== 'image' && safeContent.length > 20) {
            supabase.functions.invoke('analyze-content', {
              body: {
                content: safeContent,
                verificationId: data.verification_id
              }
            }).catch(err => console.log('Background analysis queued:', err.message));
          }

          // Success - NFT modal will show in Verify.tsx if score >= 70
          return normalizedData;

        } catch (err) {
          lastError = err;
          console.error(`❌ Attempt ${attemptCount} failed:`, err);
          
          if (attemptCount < maxAttempts) {
            const delay = Math.pow(2, attemptCount - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`🔄 Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All attempts failed - check for similar cached results as fallback
      if (!bypassCache) {
        const similarResults = enhancedVerificationCache.findSimilar(safeContent, userId, 0.7);
        if (similarResults.length > 0) {
          console.log('🔄 Using similar cached result as fallback');
          const fallbackResult = similarResults[0];
          const normalized = normalizeVerifyResult({
            ...(fallbackResult.result as any),
            fromFallback: true,
            originalError: lastError?.message
          });
          setResult(normalized as any);
          // Fallback result - NFT modal will show if eligible
          return normalized as any;
        }
      }

      throw lastError;

    } catch (err) {
      const processingTime = Date.now() - startTime;
      try {
        performanceMonitor.endTiming('verification_process');
      } catch (error) {
        // Ignore performance monitoring errors
      }
      
      // iOS Safari diagnostic for toLowerCase errors
      const errMsg = (err as Error)?.message || '';
      if (errMsg.includes('toLowerCase') || errMsg.includes('undefined is not an object')) {
        console.error('🔴 iOS toLowerCase error detected:', {
          error: errMsg,
          resultStatus: typeof result?.status,
          resultSummary: typeof result?.summary,
          userAgent: navigator.userAgent,
          isMobile: /iPhone|iPad|iPod/i.test(navigator.userAgent)
        });
        
        const userFacingMsg = 'Verification data format error (iOS). Please try again.';
        setError(userFacingMsg);
        showVerificationError(userFacingMsg);
        setLoading(false);
        inFlightKeys.current.delete(key);
        return null;
      }
      
      console.error('💥 Verification completely failed after all attempts:', err);
      
      // Track failed verification analytics
      verificationAnalytics.trackVerification({
        success: false,
        processingTime,
        confidence: 0,
        category: 'error',
        userId,
        error: (err as any)?.name || 'UnknownError'
      });
      
      // Enhanced mobile diagnostics
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const diagnostics = {
        operation: 'verification',
        userId,
        contentLength: content.length,
        hasVerificationData: !!verificationData,
        isMobile,
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent,
        swVersion: null as string | null
      };
      
      // Try to get SW version for mobile debugging
      if (isMobile && 'serviceWorker' in navigator) {
        try {
          const response = await fetch('/sw-version');
          if (response.ok) {
            const swInfo = await response.json();
            diagnostics.swVersion = swInfo.version;
          }
        } catch (swError) {
          console.log('Could not get SW version:', swError);
        }
      }
      
      // Capture detailed error information with diagnostics
      errorTracker.captureError(err instanceof Error ? err : new Error('Verification failed'));
      console.log('Mobile verification diagnostics:', diagnostics);
      
      let errorMessage = 'Verification failed - please try again';
      
      if (err instanceof Error) {
        if (err.message.includes('API Error')) {
          errorMessage = 'Tavily API temporarily unavailable - please try again';
        } else if (err.message.includes('Invalid verification result')) {
          errorMessage = 'Invalid response from verification service';
        } else if (err.message.includes('No data received')) {
          errorMessage = 'No response from verification service';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      showVerificationError(errorMessage);

      // Universal fallback: always return a minimal result for users
      const fallback = localFallbackAnalysis(safeContent, (err as Error)?.message);
      const normalized = normalizeVerifyResult(fallback as any);
      setResult(normalized as any);
      return normalized as any;
      
    } finally {
      inFlightKeys.current.delete(key);
      setLoading(false);
    }
  }, [showCacheHit, showVerificationError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      inFlightKeys.current.clear();
      setLoading(false);
      setError(null);
      setResult(null);
    };
  }, []);

  return {
    verify,
    loading,
    error,
    result
  };
}