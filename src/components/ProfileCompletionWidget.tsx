import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfileCompletionWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [verificationCount, setVerificationCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      const { count } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setVerificationCount(count || 0);
    };

    fetchData();
  }, [user]);

  if (!profile || dismissed) return null;

  const steps = [
    { key: 'avatar', label: 'Upload avatar', points: 5, completed: !!profile.avatar_url },
    { key: 'username', label: 'Choose username', points: 10, completed: !!profile.username },
    { key: 'verification', label: 'Verify first claim', points: 50, completed: verificationCount > 0 },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const totalPoints = steps.filter(s => s.completed).reduce((sum, s) => sum + s.points, 0);
  const progress = (completedSteps / steps.length) * 100;

  // Hide if 100% complete
  if (progress === 100) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary p-4 mb-6 rounded-lg relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            Complete your profile to unlock all features
          </h3>
          <div className="mb-3">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(progress)}% Complete • {totalPoints} points earned
            </p>
          </div>

          <div className="space-y-2 mb-3">
            {steps.filter(s => !s.completed).map((step) => (
              <div key={step.key} className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded border-2 border-muted-foreground" />
                <span className="text-muted-foreground">
                  {step.label} <span className="text-primary">(+{step.points} points)</span>
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {!profile.username && (
              <Button 
                size="sm" 
                onClick={() => navigate('/profile')}
              >
                Complete Profile
              </Button>
            )}
            {verificationCount === 0 && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => navigate('/verify')}
              >
                Verify First Claim
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Reward: Unlock leaderboard access + NFT eligibility
          </p>
        </div>
      </div>
    </div>
  );
}
