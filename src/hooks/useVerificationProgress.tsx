import { useState, useEffect, useCallback, useRef } from 'react';
import { useVerify } from './useVerify';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration?: number;
  error?: string;
}

interface UseVerificationProgressReturn {
  steps: VerificationStep[];
  currentStep: number;
  totalProgress: number;
  isProcessing: boolean;
  estimatedTimeRemaining: number | null;
  startVerification: (content: string) => Promise<void>;
  cancelVerification: () => void;
  result: any;
  error: string | null;
}

export const useVerificationProgress = (): UseVerificationProgressReturn => {
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [progressIntervals, setProgressIntervals] = useState<NodeJS.Timeout[]>([]);
  const verificationDoneRef = useRef(false);
  const hasStartedRef = useRef(false);

  const totalProgress = steps.reduce((acc, step) => acc + step.progress, 0) / steps.length;

  const resetProgress = useCallback(() => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending' as const,
      progress: 0,
      duration: undefined,
      error: undefined
    })));
    setCurrentStep(0);
    setIsProcessing(false);
    setStartTime(null);
    setEstimatedTimeRemaining(null);
    // Clear all intervals
    progressIntervals.forEach(clearInterval);
    setProgressIntervals([]);
    verificationDoneRef.current = false;
  }, [progressIntervals]);

  const processStep = useCallback((stepIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      if (stepIndex >= steps.length) {
        resolve();
        return;
      }

      const stepDurations = [150, 500, 350, 200, 120]; // milliseconds (faster)
      const duration = stepDurations[stepIndex] || 500;
      let progress = 0;
      const increment = 100 / (duration / 50); // Update every 50ms

      // Mark step as processing
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex ? { ...step, status: 'processing' as const } : step
      ));

      const interval = setInterval(() => {
        // If verification already finished, fast-forward this step
        if (verificationDoneRef.current && progress < 100) {
          progress = 100;
        } else {
          progress += increment;
        }
        
        setSteps(prev => prev.map((step, idx) => 
          idx === stepIndex ? { ...step, progress: Math.min(100, progress) } : step
        ));

        // Update time remaining during AI analysis step
        if (stepIndex === 1 && startTime) {
          const elapsed = Date.now() - startTime.getTime();
          const totalEstimated = 3000; // ~3 seconds total
          const remaining = Math.max(0, totalEstimated - elapsed);
          setEstimatedTimeRemaining(remaining);
        }

        if (progress >= 100) {
          clearInterval(interval);
          
          // Mark step as completed
          setSteps(prev => prev.map((step, idx) => 
            idx === stepIndex ? { 
              ...step, 
              status: 'completed' as const,
              progress: 100,
              duration 
            } : step
          ));

          resolve();
        }
      }, 50);

      setProgressIntervals(prev => [...prev, interval]);
    });
  }, [steps.length, startTime]);

  const processAllSteps = useCallback(async () => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await processStep(i);
      
      // Small delay between steps for smooth transition (skip if verification already finished)
      const delay = verificationDoneRef.current ? 0 : 200;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }, [steps.length, processStep]);

  const startVerification = useCallback(async (content: string) => {
    if (!user) return;

    resetProgress();
    setIsProcessing(true);
    setStartTime(new Date());

    try {
      // Start progress animation
      const progressPromise = processAllSteps();
      
      // Start actual verification (with fresh cache bypass)
      const verificationPromise = (async () => {
        await verify(content, user.id, true);
        verificationDoneRef.current = true;
        setEstimatedTimeRemaining(0);
      })();
      
      // Wait for both to complete
      await Promise.all([progressPromise, verificationPromise]);
      
    } catch (error) {
      console.error('Verification failed:', error);
      setSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'processing' ? 'failed' as const : step.status
      })));
    } finally {
      setIsProcessing(false);
      setEstimatedTimeRemaining(null);
    }
  }, [user, verify, resetProgress, processAllSteps]);

  const cancelVerification = useCallback(() => {
    // Clear all intervals
    progressIntervals.forEach(clearInterval);
    setProgressIntervals([]);
    resetProgress();
  }, [progressIntervals, resetProgress]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      progressIntervals.forEach(clearInterval);
    };
  }, [progressIntervals]);

  // Handle completion when result is available
  useEffect(() => {
    if (result && !loading && isProcessing) {
      // Ensure all steps are marked as completed
      setSteps(prev => prev.map(step => ({
        ...step,
        status: 'completed' as const,
        progress: 100
      })));
      setIsProcessing(false);
    }
  }, [result, loading, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      progressIntervals.forEach(interval => clearInterval(interval));
      setProgressIntervals([]);
      setIsProcessing(false);
      hasStartedRef.current = false;
      verificationDoneRef.current = false;
    };
  }, [progressIntervals]);

  return {
    steps,
    currentStep,
    totalProgress,
    isProcessing,
    estimatedTimeRemaining,
    startVerification,
    cancelVerification,
    result,
    error
  };
};