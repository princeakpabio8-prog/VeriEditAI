import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const tierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
};

export function AchievementNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Listen for new achievement notifications
    const channel = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch achievement details
          const { data: achievement } = await supabase
            .from('achievements')
            .select('*')
            .eq('id', payload.new.achievement_id)
            .single();

          if (achievement) {
            showAchievementToast(achievement);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const showAchievementToast = (achievement: any) => {
    toast.custom((t) => (
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-4 shadow-lg border-2 border-primary-foreground/20 min-w-[300px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-foreground/20 rounded-full">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
            </div>
            <p className="font-semibold flex items-center gap-2">
              {tierEmojis[achievement.tier as keyof typeof tierEmojis]} {achievement.name}
            </p>
            <p className="text-sm opacity-90 mt-1">{achievement.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-primary-foreground/20 text-primary-foreground">
                +{achievement.points} points
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  toast.dismiss(t);
                  navigate('/achievements');
                }}
              >
                View All
              </Button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center',
    });

    // Play celebration sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBUKN0fPTfCwFOYTM7+CWNFP');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  return null;
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
