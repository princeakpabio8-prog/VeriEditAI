import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Loader2, Pause, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerify } from '@/hooks/useVerify';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration?: number;
  error?: string;
}

interface VerificationProgressProps {
  verificationId: string;
  content: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
  autoStart?: boolean;
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
  verificationId,
  content,
  onComplete,
  onCancel,
  autoStart = true
}) => {
  const { user } = useAuth();
  const { verify, loading, error, result } = useVerify();
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: 'validate', name: 'Validating Content', status: 'pending', progress: 0 },
    { id: 'analyze', name: 'AI Analysis', status: 'pending', progress: 0 },
    { id: 'sources', name: 'Source Verification', status: 'pending', progress: 0 },
    { id: 'scoring', name: 'Trust Score Calculation', status: 'pending', progress: 0 },
    { id: 'finalize', name: 'Finalizing Results', status: 'pending', progress: 0 }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const totalProgress = steps.reduce((acc, step) => acc + step.progress, 0) / steps.length;

  useEffect(() => {
    if (autoStart && !startTime) {
      startVerification();
    }
  }, [autoStart, startTime]);

  const startVerification = () => {
    setStartTime(new Date());
    processSteps();
  };

  const processSteps = async () => {
    // Start the actual verification API call
    if (user && content) {
      try {
        await verify(content, user.id);
      } catch (error) {
        console.error('Verification API error:', error);
      }
    }

    for (let i = 0; i < steps.length; i++) {
      if (isPaused) return;

      setCurrentStep(i);
      await processStep(i);
    }
  };

  const processStep = async (stepIndex: number) => {
    return new Promise<void>((resolve) => {
      // Update step to processing
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex ? { ...step, status: 'processing' } : step
      ));

      // Simulate step processing with realistic timing
      const stepDurations = [800, 3000, 2500, 1200, 600]; // milliseconds
      const duration = stepDurations[stepIndex];
      let progress = 0;
      const interval = 50;
      const increment = 100 / (duration / interval);

      const progressInterval = setInterval(() => {
        progress += increment;
        
        setSteps(prev => prev.map((step, idx) => 
          idx === stepIndex ? { ...step, progress: Math.min(100, progress) } : step
        ));

        // Calculate estimated time remaining
        if (stepIndex === 1) { // During AI analysis
          const elapsed = new Date().getTime() - (startTime?.getTime() || 0);
          const totalEstimated = 8000; // 8 seconds total estimated
          const remaining = Math.max(0, totalEstimated - elapsed);
          setEstimatedTimeRemaining(remaining);
        }

        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Mark step as completed
          setSteps(prev => prev.map((step, idx) => 
            idx === stepIndex ? { 
              ...step, 
              status: 'completed', 
              progress: 100,
              duration: duration
            } : step
          ));

          // Check if this is the last step and we have results
          if (stepIndex === steps.length - 1 && result) {
            // Call onComplete with the actual verification result
            setTimeout(() => {
              onComplete?.(result);
            }, 500);
          }

          resolve();
        }
      }, interval);
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Verification in Progress
              </CardTitle>
              <CardDescription>
                AI-powered content analysis and fact-checking
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                className="gap-2"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-2 text-destructive"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-3" />
            {estimatedTimeRemaining && (
              <p className="text-xs text-muted-foreground text-center">
                {formatTimeRemaining(estimatedTimeRemaining)}
              </p>
            )}
          </div>

          {/* Step Details */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  index === currentStep 
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                    : 'bg-muted/30 border-border/50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{step.name}</span>
                    <Badge variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'processing' ? 'secondary' :
                      step.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {step.status}
                    </Badge>
                  </div>
                  {step.status === 'processing' && (
                    <Progress value={step.progress} className="h-1 mt-2" />
                  )}
                  {step.duration && step.status === 'completed' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed in {step.duration}ms
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Verification Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </motion.div>
          )}

          {/* Live Status Updates */}
          <AnimatePresence>
            {currentStep < steps.length && !error && (
              <motion.div
                className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Current: {steps[currentStep]?.name}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {currentStep === 1 && "Analyzing content with advanced AI models..."}
                  {currentStep === 2 && "Cross-referencing with trusted sources..."}
                  {currentStep === 3 && "Calculating reliability metrics..."}
                  {currentStep === 0 && "Preparing content for analysis..."}
                  {currentStep === 4 && "Generating final report..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Verification ID:</span>
            <span className="font-mono">{verificationId}</span>
          </div>
          <div className="flex justify-between">
            <span>Started:</span>
            <span>{startTime?.toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>AI Model:</span>
            <span>Llama-3.1-Sonar-Large-128k</span>
          </div>
          <div className="flex justify-between">
            <span>Analysis Type:</span>
            <span>Comprehensive Fact-Check</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};