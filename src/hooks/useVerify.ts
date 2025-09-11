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

    // Prevent duplicate in-flight requests for the same content/user
    if (inFlightKeys.current.has(key)) {
      console.log('Duplicate verify request ignored for key:', key);
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
          console.log('Using cached verification result');
          setResult(cachedResult);
          showCacheHit('content');
          setLoading(false);
          return;
        }
      } else {
        console.log('Bypassing cache for fresh verification');
      }

      inFlightKeys.current.add(key);
      console.log('Calling verify edge function...');

      // Primary attempt: fast "verify" function
      let finalData: any = null;
      let primaryError: any = null;

      const { data, error: fnError } = await supabase.functions.invoke('verify', {
        body: {
          content,
          user_id: userId
        }
      });

      if (fnError || !data) {
        console.warn('Primary verify failed, retrying once...', fnError);
        primaryError = fnError;
        // One quick retry to handle transient cold-start/network hiccups
        const { data: retryData, error: retryError } = await supabase.functions.invoke('verify', {
          body: {
            content,
            user_id: userId
          }
        });
        if (!retryError && retryData) {
          finalData = retryData;
        } else {
          primaryError = retryError || primaryError;
        }
      } else {
        finalData = data;
      }

      // Fallback: enhanced-verify (auth required, may use paid AI)
      if (!finalData) {
        console.warn('Falling back to enhanced-verify due to primary failure...');
        const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('enhanced-verify', {
          body: {
            content,
            category: 'general'
          }
        });
        if (enhancedError || !enhancedData) {
          console.error('Enhanced verify also failed:', enhancedError || primaryError);
          throw new Error((enhancedError?.message) || (primaryError?.message) || 'Verification failed');
        }
        finalData = enhancedData;
      }

      setResult(finalData);

      // Cache the result (only if not bypassed)
      if (!bypassCache) {
        verificationCache.set(content, userId, finalData);
      }

      showVerificationSuccess(finalData?.confidence ?? 0, finalData?.processing_time);

    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during verification';
      setError(errorMessage);
      showVerificationError(errorMessage);
    } finally {
      inFlightKeys.current.delete(key);
      setLoading(false);
    }
  }, [showCacheHit, showVerificationError]);

  return {
    verify,
    loading,
    error,
    result
  };
}