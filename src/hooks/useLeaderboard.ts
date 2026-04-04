import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  period_type: LeaderboardPeriod;
  verification_count: number;
  trust_score_avg: number;
  points: number;
  rank: number;
  profiles?: {
    full_name: string;
    avatar_url: string;
    username: string;
  } | null;
}

export function useLeaderboard(periodType: LeaderboardPeriod = 'all_time', limit: number = 10) {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', periodType, limit],
    queryFn: async () => {
      const today = new Date();
      let periodStart: Date;

      switch (periodType) {
        case 'daily':
          periodStart = new Date(today.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          const dayOfWeek = today.getDay();
          periodStart = new Date(today.setDate(today.getDate() - dayOfWeek));
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        default:
          periodStart = new Date(0);
      }

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('id, user_id, period_type, verification_count, trust_score_avg, points, rank')
        .eq('period_type', periodType)
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map(entry => entry.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, username')
        .in('user_id', userIds);

      return data.map(entry => ({
        ...entry,
        profiles: profiles?.find(p => p.user_id === entry.user_id) || null,
      })) as LeaderboardEntry[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - leaderboard rarely changes
    gcTime: 30 * 60 * 1000,
  });

  return {
    leaderboard: leaderboard || [],
    isLoading,
  };
}
