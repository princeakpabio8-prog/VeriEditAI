import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, Shield, User, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingProps {
  onComplete?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to VeriEdit AI',
      description: 'Your AI-powered content verification platform',
      icon: <Shield className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Get started with AI-powered fact-checking and content analysis. 
            We'll help you verify the authenticity and credibility of any content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Text Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Verify claims, facts, and statements
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">URL Verification</h4>
              <p className="text-sm text-muted-foreground">
                Check website credibility and content
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Document Review</h4>
              <p className="text-sm text-muted-foreground">
                Analyze uploaded files and documents
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Help us personalize your experience',
      icon: <User className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Your profile is set up with your email: <strong>{user?.email}</strong>
          </p>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Profile Complete
              </span>
            </div>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              You can update your profile settings anytime from the Profile page.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'license',
      title: 'Your Trial License',
      description: 'Start with 20 free verifications',
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Trial License Active
            </h4>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-sm">
              <li>• 20 free verifications per month</li>
              <li>• Basic content analysis</li>
              <li>• Trust score reports</li>
              <li>• 30-day trial period</li>
            </ul>
          </div>
          <p className="text-muted-foreground text-center">
            Upgrade anytime for unlimited verifications and advanced features.
          </p>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem('onboarding_completed', 'true');
    onComplete?.();
    navigate('/dashboard');
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {currentStepData.icon}
          </div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription className="text-lg">
            {currentStepData.description}
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStepData.content}
          
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
            
            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};