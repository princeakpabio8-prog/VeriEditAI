import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verificationCache } from '@/lib/verification-cache';
import { enhancedVerificationCache } from '@/lib/enhanced-verification-cache';
import { useEnhancedToast } from '@/components/enhanced-toast';
import { errorTracker, performanceMonitor } from '@/lib/error-tracking';
import { verificationAnalytics } from '@/lib/verification-analytics';

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
}

export function useVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const { showCacheHit, showVerificationSuccess, showVerificationError } = useEnhancedToast();
  const inFlightKeys = useRef<Set<string>>(new Set());

  const verify = useCallback(async (content: string, userId: string, bypassCache = false, verificationData?: any): Promise<VerifyResult | null> => {
    const safeContent = (content ?? '').toString();
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
          
          const flagged = { ...(cachedResult as any), fromCache: true } as VerifyResult;
          setResult(flagged);
          showCacheHit('content');
          setLoading(false);
          return flagged;
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
          
          const flagged = { ...(enhancedCached as any), fromEnhancedCache: true } as VerifyResult;
          setResult(flagged);
          showCacheHit('content');
          setLoading(false);
          return flagged;
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
          
          // Check if this is an image verification
          let functionName = 'verify';
          let requestBody: any = { content: safeContent, user_id: (userId ?? '').toString() };
          
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
              throw new Error('Failed to create verification record');
            }
            
            requestBody = {
              imageBase64: safeContent,
              verificationId: verificationRecord.id,
              userId: userId
            };
          }
          
          const { data, error: fnError } = await supabase.functions.invoke(functionName, {
            body: requestBody
          });

          performanceMonitor.endTiming('tavily_api_call');

          if (fnError) {
            errorTracker.captureError(new Error(fnError.message || 'Unknown API error'));
            throw new Error(fnError.message || `API Error: ${fnError.details || 'Unknown error'}`);
          }

          if (!data) {
            throw new Error('No data received from verification service');
          }

          // Validation
          if (typeof data.confidence !== 'number' || !data.status || !data.summary) {
            console.warn('⚠️ Incomplete verification result:', data);
            throw new Error('Invalid verification result format');
          }

          const processingTime = Date.now() - startTime;
          try {
            performanceMonitor.endTiming('verification_process');
          } catch (error) {
            // Ignore performance monitoring errors
          }
          
          console.log(`✅ Verification successful in ${processingTime}ms`);
          console.log(`📊 Confidence: ${data.confidence}% | Status: ${data.status}`);

          // Track successful verification analytics
          verificationAnalytics.trackVerification({
            success: true,
            processingTime,
            confidence: data.confidence || 0,
            category: data.category || 'general',
            userId
          });

          setResult(data);

          // Cache the result in both caches (only if not bypassed)
          if (!bypassCache) {
            verificationCache.set(safeContent, userId, data);
            enhancedVerificationCache.set(safeContent, userId, data);
          }

          showVerificationSuccess(data?.confidence ?? 0, data?.processing_time || processingTime);
          return data as VerifyResult; // Success, exit the retry loop

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
          const flagged = {
            ...(fallbackResult.result as any),
            fromFallback: true,
            originalError: lastError?.message
          } as VerifyResult;
          setResult(flagged);
          showVerificationSuccess(fallbackResult.result.confidence || 0, Date.now() - startTime);
          return flagged;
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
      console.error('💥 Verification completely failed after all attempts:', err);
      
      // Track failed verification analytics
      verificationAnalytics.trackVerification({
        success: false,
        processingTime,
        confidence: 0,
        category: 'error',
        userId,
        error: err?.name || 'UnknownError'
      });
      
      // Capture detailed error information
      errorTracker.captureError(err instanceof Error ? err : new Error('Verification failed'));
      
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
      
    } finally {
      inFlightKeys.current.delete(key);
      setLoading(false);
    }
  }, [showCacheHit, showVerificationError, showVerificationSuccess]);

  return {
    verify,
    loading,
    error,
    result
  };
}