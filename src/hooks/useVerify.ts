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

      const { data, error: fnError } = await supabase.functions.invoke('verify', {
        body: {
          content,
          user_id: userId
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Verification failed');
      }

      setResult(data);

      // Cache the result (only if not bypassed)
      if (!bypassCache) {
        verificationCache.set(content, userId, data);
      }

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