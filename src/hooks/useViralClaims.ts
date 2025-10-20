import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ViralityStatus = 'detected' | 'trending' | 'verified' | 'debunked';

interface ViralClaim {
  id: string;
  claim_text: string;
  claim_hash: string;
  platform: string;
  source_url: string;
  author: string;
  engagement_score: number;
  engagement_velocity: number;
  first_seen_at: string;
  last_checked_at: string;
  peak_engagement: number;
  status: string;
  verification_id: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

interface ClaimMention {
  id: string;
  viral_claim_id: string;
  platform: string;
  source_url: string;
  engagement_count: number;
  posted_at: string;
  detected_at: string;
  metadata: any;
}

export function useViralClaims(status?: string) {
  const { data: viralClaims, isLoading } = useQuery({
    queryKey: ['viral-claims', status],
    queryFn: async () => {
      let query = supabase
        .from('viral_claims')
        .select('*')
        .order('engagement_velocity', { ascending: false })
        .limit(20);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ViralClaim[];
    },
  });

  return {
    viralClaims: viralClaims || [],
    isLoading,
  };
}

export function useClaimDetails(viralClaimId: string) {
  const { data: claim, isLoading } = useQuery({
    queryKey: ['viral-claim-detail', viralClaimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viral_claims')
        .select('*')
        .eq('id', viralClaimId)
        .maybeSingle();

      if (error) throw error;
      return data as ViralClaim | null;
    },
    enabled: !!viralClaimId,
  });

  return {
    claim,
    isLoading,
  };
}
