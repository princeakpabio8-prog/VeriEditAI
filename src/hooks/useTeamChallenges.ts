import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ChallengeType = 'verification_count' | 'trust_score_avg' | 'source_diversity' | 'speed';
type ChallengeStatus = 'active' | 'completed' | 'expired';

interface TeamChallenge {
  id: string;
  room_id: string;
  challenge_type: ChallengeType;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  reward_points: number;
  status: ChallengeStatus;
  created_by: string;
  metadata: any;
}

export function useTeamChallenges(roomId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['team-challenges', roomId],
    queryFn: async () => {
      let query = supabase
        .from('team_challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamChallenge[];
    },
    enabled: !!user,
  });

  const createChallenge = useMutation({
    mutationFn: async (challenge: Omit<TeamChallenge, 'id' | 'current_value' | 'status' | 'metadata'>) => {
      const { data, error } = await supabase
        .from('team_challenges')
        .insert({
          ...challenge,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-challenges'] });
      toast.success('Challenge created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create challenge:', error);
      toast.error('Failed to create challenge');
    },
  });

  const updateChallengeProgress = useMutation({
    mutationFn: async ({ challengeId, newValue }: { challengeId: string; newValue: number }) => {
      const { error } = await supabase
        .from('team_challenges')
        .update({ current_value: newValue })
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-challenges'] });
    },
  });

  return {
    challenges: challenges || [],
    isLoading,
    createChallenge: createChallenge.mutate,
    isCreating: createChallenge.isPending,
    updateProgress: updateChallengeProgress.mutate,
  };
}
