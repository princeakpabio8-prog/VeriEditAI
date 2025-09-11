import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerificationProgress } from '@/hooks/useVerificationProgress';

interface VerificationProgressProps {
  verificationId: string;
  content: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
  verificationId,
  content,
  onComplete,
  onCancel,
}) => {
  const {
    steps,
    currentStep,
    totalProgress,
    isProcessing,
    estimatedTimeRemaining,
    startVerification,
    cancelVerification,
    result,
    error
  } = useVerificationProgress();

  // Start verification automatically when component mounts
  React.useEffect(() => {
    startVerification(content);
  }, [content, startVerification]);

  // Handle completion
  React.useEffect(() => {
    if (result && !isProcessing) {
      onComplete?.(result);
    }
  }, [result, isProcessing, onComplete]);

  const handleCancel = () => {
    cancelVerification();
    onCancel?.();
  };

  const getStepIcon = (step: any) => {
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
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
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
            {currentStep < steps.length && !error && isProcessing && (
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
                  {currentStep === 0 && "Preparing content for analysis..."}
                  {currentStep === 1 && "Analyzing content with advanced AI models..."}
                  {currentStep === 2 && "Cross-referencing with trusted sources..."}
                  {currentStep === 3 && "Calculating reliability metrics..."}
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
            <span>AI Model:</span>
            <span>Llama-3.1-Sonar-Large-128k</span>
          </div>
          <div className="flex justify-between">
            <span>Analysis Type:</span>
            <span>Multi-Source Fact-Check</span>
          </div>
          <div className="flex justify-between">
            <span>Progress:</span>
            <span>{Math.round(totalProgress)}% Complete</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};