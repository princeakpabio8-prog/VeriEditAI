import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Flame, Sparkles, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationRitualProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (ritualData: {
    title: string;
    content: string;
    autoVerify: boolean;
    ritualMetadata: any;
  }) => Promise<void>;
  onViewThread?: () => void;
}

type RitualStep = 'intention' | 'commitment' | 'witness' | 'ignition' | 'waiting' | 'revelation';

export function VerificationRitual({ open, onOpenChange, onComplete, onViewThread }: VerificationRitualProps) {
  const [currentStep, setCurrentStep] = useState<RitualStep>('intention');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commitment, setCommitment] = useState('');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const ritualMessages = [
    "Consulting ancient scrolls...",
    "Traversing knowledge streams...",
    "Seeking wisdom from the elders...",
    "Weighing truth against feathers...",
    "Reading the celestial patterns...",
    "Gathering witness testimony...",
    "Illuminating hidden connections...",
    "The flame grows stronger..."
  ];

  const commitmentPhrase = "I commit to truth";

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCurrentStep('intention');
        setTitle('');
        setContent('');
        setCommitment('');
        setVerificationProgress(0);
        setVerificationResult(null);
        setIsProcessing(false);
      }, 300);
    }
  }, [open]);

  const handleNext = async () => {
    if (currentStep === 'intention' && title && content) {
      setCurrentStep('commitment');
    } else if (currentStep === 'commitment' && commitment === commitmentPhrase) {
      setCurrentStep('witness');
    } else if (currentStep === 'witness') {
      setCurrentStep('ignition');
    } else if (currentStep === 'ignition') {
      await performRitual();
    }
  };

  const performRitual = async () => {
    setCurrentStep('waiting');
    setIsProcessing(true);

    // Simulate verification progress with poetic status messages
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setVerificationProgress(prev => {
        currentProgress = prev;
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        // Update status message based on progress
        const messageIndex = Math.floor((prev / 100) * ritualMessages.length);
        setStatusMessage(ritualMessages[Math.min(messageIndex, ritualMessages.length - 1)]);
        return prev + Math.random() * 10;
      });
    }, 300);

    try {
      // Create ritual metadata
      const ritualMetadata = {
        ritual_performed: true,
        commitment_timestamp: new Date().toISOString(),
        ritual_type: 'verification_ceremony'
      };

      // Call the completion handler
      await onComplete({
        title,
        content,
        autoVerify: true,
        ritualMetadata
      });

      clearInterval(progressInterval);
      setVerificationProgress(100);
      
      // Move to revelation after completion
      setTimeout(() => {
        setCurrentStep('revelation');
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Ritual failed:', error);
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intention':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold">What truth are you seeking?</h2>
              <p className="text-muted-foreground">
                State your intention clearly. Every search for truth begins with a question.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Thread Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What claim will you verify?"
                  className="border-[hsl(var(--ritual-sacred))]/30 focus:border-[hsl(var(--ritual-sacred))]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Claim or Question</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe what you want to verify..."
                  rows={4}
                  className="border-[hsl(var(--ritual-sacred))]/30 focus:border-[hsl(var(--ritual-sacred))]"
                />
              </div>
            </div>

            <Button 
              onClick={handleNext}
              disabled={!title || !content}
              className="w-full bg-[hsl(var(--ritual-sacred))] hover:bg-[hsl(var(--ritual-sacred))]/90"
            >
              Continue to Commitment
            </Button>
          </motion.div>
        );

      case 'commitment':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="text-6xl mb-4">✋</div>
              <h2 className="text-2xl font-bold">Make Your Commitment</h2>
              <p className="text-muted-foreground">
                Truth-seeking requires dedication. Make your vow.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[hsl(var(--ritual-sacred))]/10 border border-[hsl(var(--ritual-sacred))]/30">
              <p className="text-center text-lg font-semibold mb-4 text-[hsl(var(--ritual-sacred))]">
                Type the commitment phrase:
              </p>
              <p className="text-center text-xl font-bold mb-4 tracking-wide">
                "{commitmentPhrase}"
              </p>
              
              <Input
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                placeholder="Type the commitment phrase exactly..."
                className={`text-center text-lg ${
                  commitment === commitmentPhrase 
                    ? 'border-green-500 ring-2 ring-green-500/20' 
                    : 'border-[hsl(var(--ritual-sacred))]/30'
                }`}
              />
              
              {commitment && commitment !== commitmentPhrase && (
                <p className="text-sm text-destructive text-center mt-2">
                  The commitment must match exactly
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('intention')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={commitment !== commitmentPhrase}
                className="flex-1 bg-[hsl(var(--ritual-sacred))] hover:bg-[hsl(var(--ritual-sacred))]/90"
              >
                I Commit
              </Button>
            </div>
          </motion.div>
        );

      case 'witness':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <Users className="w-16 h-16 mx-auto text-[hsl(var(--ritual-sacred))]" />
              <h2 className="text-2xl font-bold">Truth is Witnessed</h2>
              <p className="text-muted-foreground">
                Your search for truth will be witnessed by the community
              </p>
            </div>

            <div className="p-6 rounded-lg bg-gradient-to-br from-[hsl(var(--ritual-sacred))]/10 to-transparent border border-[hsl(var(--ritual-sacred))]/30">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Community members will be invited to witness your verification
              </p>
              <div className="flex justify-center items-center gap-2">
                <Sparkles className="w-5 h-5 text-[hsl(var(--ritual-sacred))]" />
                <span className="text-sm font-medium">Witnesses will be notified</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('commitment')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleNext}
                className="flex-1 bg-[hsl(var(--ritual-sacred))] hover:bg-[hsl(var(--ritual-sacred))]/90"
              >
                Continue to Ignition
              </Button>
            </div>
          </motion.div>
        );

      case 'ignition':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame className="w-20 h-20 mx-auto text-[hsl(var(--truth-flame))]" />
              </motion.div>
              <h2 className="text-2xl font-bold">Ignite the Verification</h2>
              <p className="text-muted-foreground">
                Light the flame of truth. Begin your verification journey.
              </p>
            </div>

            <motion.div
              className="relative p-12 rounded-full bg-gradient-radial from-[hsl(var(--truth-flame))]/20 to-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleNext}
                disabled={isProcessing}
                className="w-full h-20 text-lg font-semibold bg-[hsl(var(--truth-flame))] hover:bg-[hsl(var(--truth-ember))] shadow-lg shadow-[hsl(var(--truth-flame))]/50"
              >
                <Flame className="w-6 h-6 mr-2" />
                Ignite Verification
              </Button>
            </motion.div>
          </motion.div>
        );

      case 'waiting':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 relative"
          >
            <div className="ritual-particle-bg" />
            
            <div className="text-center space-y-3 relative z-10">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame className="w-20 h-20 mx-auto text-[hsl(var(--truth-flame))]" />
              </motion.div>
              <h2 className="text-2xl font-bold">The Flame Burns...</h2>
              <motion.p
                key={statusMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground italic text-lg"
              >
                {statusMessage || "Beginning the ritual..."}
              </motion.p>
            </div>

            <div className="space-y-3 relative z-10">
              <Progress value={verificationProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(verificationProgress)}% Complete
              </p>
            </div>
          </motion.div>
        );

      case 'revelation':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
              >
                <Sparkles className="w-20 h-20 mx-auto text-[hsl(var(--truth-bloom))]" />
              </motion.div>
              <h2 className="text-2xl font-bold">Truth Revealed</h2>
              <p className="text-muted-foreground">
                Your verification ritual is complete
              </p>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-lg bg-gradient-to-br from-[hsl(var(--truth-bloom))]/10 to-transparent border border-[hsl(var(--truth-bloom))]/30 text-center"
            >
              <p className="text-4xl font-bold text-[hsl(var(--truth-bloom))] mb-2">
                🌳
              </p>
              <p className="text-lg font-semibold mb-1">
                Your truth has been planted
              </p>
              <p className="text-sm text-muted-foreground">
                Watch it grow in the Truth Garden as verification completes
              </p>
            </motion.div>

            <Button 
              onClick={() => {
                if (onViewThread) {
                  onViewThread();
                } else {
                  onOpenChange(false);
                }
              }}
              className="w-full bg-[hsl(var(--truth-bloom))] hover:bg-[hsl(var(--truth-bloom))]/90"
            >
              View Your Thread
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-[hsl(var(--ritual-sacred))]/30">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
