import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, User, CreditCard, Rocket, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UnifiedOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export const UnifiedOnboarding: React.FC<UnifiedOnboardingProps> = ({ open, onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to VeriEdit AI',
      icon: <Shield className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Get started with AI-powered fact-checking in 3 simple steps
          </p>
          <div className="grid grid-cols-1 gap-3 mt-6">
            <div className="p-4 bg-muted/50 rounded-lg text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔥</span>
                <h4 className="font-medium">1. Pick a Viral Claim</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Browse hot claims or paste your own
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⚡</span>
                <h4 className="font-medium">2. Click "Verify Now"</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                AI analyzes sources and trust signals
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏆</span>
                <h4 className="font-medium">3. Get Results & Rewards</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Trust score, points, and achievements
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'profile',
      title: 'Your Profile',
      icon: <User className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Signed in as <strong>{user?.email}</strong>
          </p>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Profile Ready</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete your profile later to unlock:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Leaderboard access</li>
              <li>• NFT badge eligibility</li>
              <li>• Social sharing features</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'license',
      title: 'Your Free Trial',
      icon: <CreditCard className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-6 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">Trial Active</h4>
              <span className="text-2xl font-bold text-primary">10</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Free verifications this month
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>AI-powered analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Trust score reports</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Source verification</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Resets monthly • Upgrade anytime for unlimited verifications
          </p>
        </div>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
    }
    onComplete();
    navigate('/verify');
  };

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
    }
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">{currentStepData.icon}</div>
            <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
            {currentStepData.content}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isLastStep ? (
              <Button onClick={handleComplete} className="flex-1" size="lg">
                <Rocket className="h-4 w-4 mr-2" />
                Start Verifying
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1" size="lg">
                Next
              </Button>
            )}
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
          </div>

          {currentStep === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Takes less than 60 seconds
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
