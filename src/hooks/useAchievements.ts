import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  icon_name: string;
  points: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievements: Achievement;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user!.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      setAchievements(data || []);
      const points = data?.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0) || 0;
      setTotalPoints(points);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('calculate-achievements');
      
      if (error) throw error;
      
      if (data?.new_achievements?.length > 0) {
        // Refresh achievements
        await fetchAchievements();
      }
      
      return data;
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getTopAchievements = (limit = 3) => {
    return achievements
      .sort((a, b) => (b.achievements?.points || 0) - (a.achievements?.points || 0))
      .slice(0, limit);
  };

  return {
    achievements,
    totalPoints,
    loading,
    checkAchievements,
    getTopAchievements,
    refreshAchievements: fetchAchievements,
  };
}
