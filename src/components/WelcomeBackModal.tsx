import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WelcomeBackModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!user) return;

    const checkIfDormant = async () => {
      // Check if user has any verifications
      const { count } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check if we've shown this modal before (using localStorage)
      const hasSeenModal = localStorage.getItem(`welcome_back_${user.id}`);

      if (count === 0 && !hasSeenModal) {
        setOpen(true);
      }
    };

    checkIfDormant();
  }, [user]);

  const handleClose = () => {
    setOpen(false);
    if (user) {
      localStorage.setItem(`welcome_back_${user.id}`, 'true');
    }
  };

  const handleStartVerification = () => {
    handleClose();
    navigate('/verify');
  };

  const steps = [
    {
      title: 'Pick a Viral Claim',
      description: 'Browse hot claims from our viral claims dashboard',
      icon: '🔥',
    },
    {
      title: 'Click "Verify Now"',
      description: 'Our AI will analyze sources and calculate a trust score',
      icon: '⚡',
    },
    {
      title: 'See Your Results',
      description: 'Get your trust score, earn points, and unlock achievements',
      icon: '🏆',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Welcome back! 🎉</DialogTitle>
          </div>
          <DialogDescription>
            Let's get you started in 60 seconds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex gap-3 p-3 rounded-lg transition-all ${
                currentStep === index + 1
                  ? 'bg-primary/10 border-2 border-primary'
                  : currentStep > index + 1
                  ? 'bg-muted/50'
                  : 'bg-muted/20'
              }`}
            >
              <div className="flex-shrink-0 text-2xl">{step.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">
                    {index + 1}. {step.title}
                  </h4>
                  {currentStep > index + 1 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleStartVerification} className="flex-1">
            Start First Verification
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Skip
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Complete your profile after for bonuses and leaderboard access
        </p>
      </DialogContent>
    </Dialog>
  );
}
