import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useVerificationAchievements() {
  const { user } = useAuth();

  const checkAchievementsAfterVerification = async () => {
    if (!user) return;

    try {
      // Call the edge function to check and award achievements
      await supabase.functions.invoke('calculate-achievements');
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  return { checkAchievementsAfterVerification };
}
