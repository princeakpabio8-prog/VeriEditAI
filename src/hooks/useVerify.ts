import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verificationCache } from '@/lib/verification-cache';
import { enhancedVerificationCache } from '@/lib/enhanced-verification-cache';
import { useEnhancedToast } from '@/components/enhanced-toast';

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
  created_at: string;
}

export function useVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const { showCacheHit, showVerificationSuccess, showVerificationError } = useEnhancedToast();
  const inFlightKeys = useRef<Set<string>>(new Set());

  const verify = useCallback(async (content: string, userId: string, bypassCache = false) => {
    const key = `${userId}::${content}`;
    const startTime = Date.now();

    // Prevent duplicate in-flight requests for the same content/user
    if (inFlightKeys.current.has(key)) {
      console.log('🚫 Duplicate verify request ignored for key:', key.substring(0, 30) + '...');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check cache first (unless bypassed)
      if (!bypassCache) {
        const cachedResult = verificationCache.get(content, userId);
        if (cachedResult) {
          const cacheAge = Math.round((Date.now() - (cachedResult.created_at ? new Date(cachedResult.created_at).getTime() : 0)) / 1000 / 60);
          console.log(`💾 Using cached verification result (${cacheAge} minutes old)`);
          setResult(cachedResult);
          showCacheHit('content');
          setLoading(false);
          return;
        }
      } else {
        console.log('⚡ Bypassing cache for fresh verification');
      }

      inFlightKeys.current.add(key);
      console.log('🚀 Calling verify edge function...');

      // Enhanced error handling with retry logic
      let attemptCount = 0;
      const maxAttempts = 2;
      let lastError: any = null;

      while (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`📡 Verification attempt ${attemptCount}/${maxAttempts}`);

        try {
          const { data, error: fnError } = await supabase.functions.invoke('verify', {
            body: {
              content,
              user_id: userId
            }
          });

          if (fnError) {
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
          console.log(`✅ Verification successful in ${processingTime}ms`);
          console.log(`📊 Confidence: ${data.confidence}% | Status: ${data.status}`);

          setResult(data);

          // Cache the result (only if not bypassed)
          if (!bypassCache) {
            verificationCache.set(content, userId, data);
          }

          showVerificationSuccess(data?.confidence ?? 0, data?.processing_time || processingTime);
          return; // Success, exit the retry loop

        } catch (err) {
          lastError = err;
          console.error(`❌ Attempt ${attemptCount} failed:`, err);
          
          if (attemptCount < maxAttempts) {
            console.log('🔄 Retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // All attempts failed
      throw lastError;

    } catch (err) {
      const processingTime = Date.now() - startTime;
      console.error('💥 Verification completely failed after all attempts:', err);
      
      let errorMessage = 'Verification failed - please try again';
      
      if (err instanceof Error) {
        if (err.message.includes('API Error')) {
          errorMessage = 'Service temporarily unavailable - please try again';
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
      
      // Track error for analytics
      console.log(`📈 Error analytics: ${errorMessage} (${processingTime}ms)`);
      
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