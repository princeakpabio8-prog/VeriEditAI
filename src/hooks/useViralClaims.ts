import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function useViralClaims(status?: string) {
  const { data: viralClaims, isLoading, refetch } = useQuery({
    queryKey: ['viral-claims', status],
    queryFn: async () => {
      let query = supabase
        .from('viral_claims')
        .select('id, claim_text, platform, source_url, engagement_score, engagement_velocity, first_seen_at, status, verification_id, image_url, updated_at')
        .order('engagement_velocity', { ascending: false })
        .limit(20);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ViralClaim[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  return {
    viralClaims: viralClaims || [],
    isLoading,
    refetch,
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
    staleTime: 2 * 60 * 1000,
  });

  return { claim, isLoading };
}
