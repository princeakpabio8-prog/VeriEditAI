import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
}

interface VerifyPageTutorialProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Verification!',
    description: 'Let me guide you through your first verification. You can verify text, URLs, documents, or images.',
    targetSelector: '[data-tutorial="content-tabs"]',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'input-text',
    title: 'Enter Content to Verify',
    description: 'Type or paste any claim, statement, or text you want to fact-check. Try something like a news headline or factual claim.',
    targetSelector: '[data-tutorial="text-input"]',
    position: 'top',
    highlightPadding: 12,
  },
  {
    id: 'verify-button',
    title: 'Start Verification',
    description: 'Click this button to analyze your content. Our AI will check facts, sources, and provide a trust score.',
    targetSelector: '[data-tutorial="verify-button"]',
    position: 'top',
    highlightPadding: 8,
  },
  {
    id: 'results',
    title: 'View Results',
    description: 'After verification, you\'ll see a detailed analysis including trust score, sources, and AI insights. Results appear here!',
    targetSelector: '[data-tutorial="results-area"]',
    position: 'top',
    highlightPadding: 12,
  },
];

export const VerifyPageTutorial: React.FC<VerifyPageTutorialProps> = ({
  isActive,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const updateHighlight = () => {
      const step = tutorialSteps[currentStep];
      const element = document.querySelector(step.targetSelector);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const currentStepData = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!highlightRect) return {};

    const padding = currentStepData.highlightPadding || 8;
    const tooltipOffset = 20;

    switch (currentStepData.position) {
      case 'top':
        return {
          top: highlightRect.top - tooltipOffset,
          left: highlightRect.left + highlightRect.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: highlightRect.bottom + tooltipOffset,
          left: highlightRect.left + highlightRect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: highlightRect.top + highlightRect.height / 2,
          left: highlightRect.left - tooltipOffset,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: highlightRect.top + highlightRect.height / 2,
          left: highlightRect.right + tooltipOffset,
          transform: 'translateY(-50%)',
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Dark overlay with cutout */}
            <svg className="w-full h-full">
              <defs>
                <mask id="tutorial-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {highlightRect && (
                    <rect
                      x={highlightRect.left - (currentStepData.highlightPadding || 8)}
                      y={highlightRect.top - (currentStepData.highlightPadding || 8)}
                      width={highlightRect.width + (currentStepData.highlightPadding || 8) * 2}
                      height={highlightRect.height + (currentStepData.highlightPadding || 8) * 2}
                      rx="8"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.7)"
                mask="url(#tutorial-mask)"
              />
            </svg>

            {/* Highlight border */}
            {highlightRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute border-2 border-primary rounded-lg shadow-lg shadow-primary/50"
                style={{
                  left: highlightRect.left - (currentStepData.highlightPadding || 8),
                  top: highlightRect.top - (currentStepData.highlightPadding || 8),
                  width: highlightRect.width + (currentStepData.highlightPadding || 8) * 2,
                  height: highlightRect.height + (currentStepData.highlightPadding || 8) * 2,
                }}
              />
            )}
          </motion.div>

          {/* Tooltip Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[60] pointer-events-auto"
            style={{
              ...getTooltipPosition(),
              maxWidth: '400px',
            }}
          >
            <Card className="shadow-xl border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1"
                    onClick={onSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-sm">
                  {currentStepData.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Progress */}
                <div className="flex items-center gap-2">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-muted-foreground"
                  >
                    Skip Tutorial
                  </Button>

                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                      >
                        Back
                      </Button>
                    )}
                    <Button size="sm" onClick={handleNext} className="gap-1">
                      {isLastStep ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Got it!
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
