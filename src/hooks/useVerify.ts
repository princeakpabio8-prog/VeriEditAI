import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const verify = async (content: string, userId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
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