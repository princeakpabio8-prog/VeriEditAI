import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';

export interface TrustAnalytic {
  id: string;
  source: string;
  domain: string | null;
  region: string;
  topic: string;
  average_trust_score: number;
  verification_count: number;
  trending_direction: string | null;
  week_over_week_change: number | null;
  credibility_tier: string | null;
  created_at: string;
}

export interface TrustSnapshot {
  id: string;
  global_trust_index: number;
  snapshot_date: string;
  total_verifications: number;
  high_credibility_percentage: number | null;
  misinformation_spike_regions: string[] | null;
  trending_low_topics: string[] | null;
}

export const useTrustIntelligence = (daysBack: number = 7) => {
  const startDate = addDays(new Date(), -daysBack);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['trust-analytics', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrustAnalytic[];
    },
  });

  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ['trust-snapshots', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_index_snapshots')
        .select('*')
        .gte('snapshot_date', format(startDate, 'yyyy-MM-dd'))
        .order('snapshot_date', { ascending: false });

      if (error) throw error;
      return data as TrustSnapshot[];
    },
  });

  const { data: brief, isLoading: briefLoading } = useQuery({
    queryKey: ['trust-brief', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_briefs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  return {
    analytics: analytics || [],
    snapshots: snapshots || [],
    brief,
    isLoading: analyticsLoading || snapshotsLoading || briefLoading,
    currentTrustIndex: snapshots?.[0]?.global_trust_index || 70,
  };
};