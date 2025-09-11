import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verificationCache } from '@/lib/verification-cache';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const verify = async (content: string, userId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check cache first
      const cachedResult = verificationCache.get(content, userId);
      if (cachedResult) {
        console.log('Using cached verification result');
        setResult(cachedResult);
        toast({
          title: "Verification Retrieved",
          description: "Found previous verification from cache",
        });
        setLoading(false);
        return;
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

      console.log('Verification result:', data);
      setResult(data);
      
      // Cache the result
      verificationCache.set(content, userId, data);
      
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
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