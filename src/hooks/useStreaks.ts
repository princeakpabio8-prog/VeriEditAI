import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VerificationStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_verification_date: string | null;
  streak_freeze_count: number;
}

export function useStreaks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: streak, isLoading } = useQuery({
    queryKey: ['verification-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('verification_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as VerificationStreak | null;
    },
    enabled: !!user,
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      const { error } = await supabase.rpc('update_verification_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-streak', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to update streak:', error);
      toast.error('Failed to update streak');
    },
  });

  return {
    streak,
    isLoading,
    updateStreak: updateStreakMutation.mutate,
    isUpdating: updateStreakMutation.isPending,
  };
}
