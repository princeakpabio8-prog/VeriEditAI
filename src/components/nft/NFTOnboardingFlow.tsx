import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, Wallet, TrendingUp, Smartphone, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NFTOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function NFTOnboardingFlow({ isOpen, onClose, onComplete }: NFTOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const steps = [
    {
      title: "What is a Truth Badge?",
      icon: Award,
      description: "A Truth Badge is a digital collectible (NFT) that proves you verified truthful content.",
      content: (
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground mb-2">Think of it like a trophy! 🏆</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Permanent proof on blockchain</li>
              <li>✓ Shows you fight misinformation</li>
              <li>✓ Rare badges are more valuable</li>
              <li>✓ Can be traded or kept forever</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Higher trust scores = rarer badges = more impressive!
          </p>
        </div>
      )
    },
    {
      title: "How Do I Earn Badges?",
      icon: TrendingUp,
      description: "Simple 3-step process to earn your first NFT badge",
      content: (
        <div className="space-y-3">
          <Card className="p-3 bg-background/50 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Verify Content</p>
                <p className="text-xs text-muted-foreground">Submit any claim or news article for fact-checking</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-background/50 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Get High Score</p>
                <p className="text-xs text-muted-foreground">Need 70%+ trust score to unlock minting</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-background/50 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Mint Your Badge</p>
                <p className="text-xs text-muted-foreground">Connect wallet and mint (almost free!)</p>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      title: "Do I Need a Wallet?",
      icon: Wallet,
      description: "Yes, but it's easy to set up on your phone in 2 minutes",
      content: (
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-semibold text-foreground mb-3">📱 Recommended Mobile Wallets:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-background rounded">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">M</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">MetaMask</p>
                  <p className="text-xs text-muted-foreground">Most popular, easy to use</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">T</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">Trust Wallet</p>
                  <p className="text-xs text-muted-foreground">Great for beginners</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">R</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">Rainbow</p>
                  <p className="text-xs text-muted-foreground">Beautiful interface</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            💡 Download any wallet from your app store, create account, and you're ready!
          </p>
        </div>
      )
    },
    {
      title: "How Much Does It Cost?",
      icon: Smartphone,
      description: "Minting is FREE! Only pay tiny network fees",
      content: (
        <div className="space-y-4">
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
            <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
              Minting: $0.00 ✨
            </p>
            <p className="text-xs text-muted-foreground">
              We don't charge anything to mint your badge!
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-semibold text-foreground mb-2">
              Gas Fees: ~$0.02 ⛽
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Small network fee to process your transaction on Polygon blockchain
            </p>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 bg-background rounded p-2">
                <p className="text-muted-foreground">Average cost</p>
                <p className="font-semibold text-foreground">$0.01 - $0.03</p>
              </div>
              <div className="flex-1 bg-background rounded p-2">
                <p className="text-muted-foreground">Paid in</p>
                <p className="font-semibold text-foreground">MATIC tokens</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💰 Your wallet will show the exact cost before you confirm
          </p>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    
    // Mark onboarding as completed
    localStorage.setItem('nft_onboarding_completed', 'true');
    
    // Navigate to verify page
    if (!user) {
      navigate('/auth?feature=nft');
    } else {
      navigate('/verify');
    }
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('nft_onboarding_completed', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-background border-primary/20 p-0 gap-0">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 pb-4 border-b border-primary/20">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full hover:bg-white/10"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p>
              <h3 className="text-lg font-bold text-foreground">{currentStep.title}</h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep.content}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 px-6 pb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step 
                  ? 'w-8 bg-primary' 
                  : idx < step 
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 gap-2"
          >
            {step === steps.length - 1 ? "Let's Start!" : 'Next'}
            {step < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Skip Option */}
        <div className="px-6 pb-6 pt-0">
          <button
            onClick={handleSkip}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
