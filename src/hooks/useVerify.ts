import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verificationCache } from '@/lib/verification-cache';
import { useEnhancedToast } from '@/components/enhanced-toast';

interface VerifyResult {
  confidence: number;
  status: string;
  summary: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
  created_at: string;
}

export function useVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const { showCacheHit, showVerificationSuccess, showVerificationError } = useEnhancedToast();

  const verify = async (content: string, userId: string, bypassCache = false) => {
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
      setLoading(false);
    }
  };

  return {
    verify,
    loading,
    error,
    result
  };
}