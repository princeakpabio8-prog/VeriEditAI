import { useState } from "react";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VerificationUpload } from "@/components/verification-upload";
import { motion, AnimatePresence } from "framer-motion";

interface QuickVerifyFABProps {
  onVerificationStart: (data: any) => void;
}

export const QuickVerifyFAB = ({ onVerificationStart }: QuickVerifyFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <motion.div
        className="fixed right-6 z-40 bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] md:bottom-24"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3, type: "spring", stiffness: 200 }}
      >
        <Button
          aria-label="Quick verify"
          title="Quick verify"
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          size="lg"
          className="h-14 rounded-md shadow-sm hover:shadow-sm transition-all bg-primary hover:bg-primary/90 group relative overflow-hidden"
        >
          <motion.div
            className="flex items-center gap-2"
            animate={{ width: isHovered ? "auto" : "56px" }}
            transition={{ duration: 0.2 }}
          >
            <Shield className="h-6 w-6 flex-shrink-0" />
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap pr-2"
                >
                  Quick Verify
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Pulse effect */}

        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Quick Verification
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            <p className="text-muted-foreground mb-6">
              Instantly verify any claim, article, or content with AI-powered trust scoring.
            </p>
            <VerificationUpload 
              onVerificationStart={(data) => {
                onVerificationStart(data);
                setIsOpen(false);
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
