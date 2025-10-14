import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClaimVersion {
  id: string;
  verification_id: string;
  original_verification_id: string | null;
  content_hash: string;
  semantic_similarity: number;
  version_number: number;
  confidence_delta: number;
  created_at: string;
  metadata: any;
}

export const useClaimVersions = (verificationId: string | null) => {
  const [versions, setVersions] = useState<ClaimVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!verificationId) return;

    const fetchVersions = async () => {
      setLoading(true);
      try {
        // Get versions where this is the verification or the original
        const { data, error } = await supabase
          .from('claim_versions')
          .select('*')
          .or(`verification_id.eq.${verificationId},original_verification_id.eq.${verificationId}`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setVersions(data || []);
      } catch (error) {
        console.error('Error fetching claim versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [verificationId]);

  return { versions, loading };
};
