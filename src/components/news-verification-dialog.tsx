import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerificationProgress } from "./verification-progress";
import { VerificationResult } from "./verification-result";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface NewsVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: string;
    title: string;
    summary: string;
    link: string;
    source: string;
    published_at: string;
  };
  userId: string;
  onVerificationComplete: (verificationId: string, trustScore: number) => void;
}

export function NewsVerificationDialog({
  open,
  onOpenChange,
  article,
  userId,
  onVerificationComplete,
}: NewsVerificationDialogProps) {
  const [verificationState, setVerificationState] = useState<"loading" | "complete">("loading");
  const [result, setResult] = useState<any>(null);
  const [verificationId] = useState(() => crypto.randomUUID());

  const content = `${article.title}\n\n${article.summary}\n\nSource: ${article.link}`;

  const handleComplete = (verificationResult: any) => {
    setResult(verificationResult);
    setVerificationState("complete");
    
    const trustScore = verificationResult.confidence || 0;
    onVerificationComplete(verificationResult.verificationId || verificationId, trustScore);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state for next verification
    setTimeout(() => {
      setVerificationState("loading");
      setResult(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: verificationState === "loading" ? Infinity : 0,
                repeatDelay: 1,
              }}
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              News Verification
            </span>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {verificationState === "loading" ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VerificationProgress
                verificationId={verificationId}
                content={content}
                onComplete={handleComplete}
                onCancel={handleCancel}
              />
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {result && (
                <VerificationResult
                  verificationId={result.verificationId || verificationId}
                  trustScore={result.confidence || 0}
                  status={result.status || "unknown"}
                  summary={result.summary || ""}
                  analysis={result.analysis}
                  sources={result.sources || []}
                  sourceConsensus={result.source_consensus}
                  methods={result.verification_method}
                  category={result.category}
                  processingTime={result.processing_time}
                  content={content}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}