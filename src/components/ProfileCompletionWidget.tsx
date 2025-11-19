import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="border-l-4 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-background mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="pt-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground mb-1">
              Level Up Your Profile!
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Unlock rewards and climb the leaderboard
            </p>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
                <span className="text-sm font-bold text-primary">
                  {totalPoints} / {steps.reduce((sum, s) => sum + s.points, 0)} points
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>

            <div className="space-y-2.5 mb-4">
              {steps.filter(s => !s.completed).map((step) => (
                <div 
                  key={step.key} 
                  className="flex items-center gap-2.5 text-sm p-2 rounded-md bg-background/50 border border-border/50"
                >
                  <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary/20" />
                  </div>
                  <span className="flex-1 font-medium">
                    {step.label}
                  </span>
                  <span className="text-primary font-semibold">+{step.points}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {!profile.username && (
                <Button 
                  size="sm" 
                  onClick={() => navigate('/profile')}
                  className="flex-1 min-w-[140px]"
                >
                  Complete Profile
                </Button>
              )}
              {verificationCount === 0 && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => navigate('/verify')}
                  className="flex-1 min-w-[140px]"
                >
                  Verify First Claim
                </Button>
              )}
            </div>

            <div className="mt-3 p-2 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-foreground">
                🎁 Completion Bonus: Leaderboard access + NFT eligibility + 5 bonus verifications
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
