import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { X, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallBanner() {
  const { isInstallable, isUpdateAvailable, installApp, updateApp, dismissUpdate } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Don't show again for 7 days if dismissed
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa_banner_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  };

  // Update available banner (always show)
  if (isUpdateAvailable) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-xl p-4 shadow-2xl shadow-primary/10">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Update Available</p>
                <p className="text-xs text-muted-foreground mt-0.5">A new version of VeriEdit AI is ready</p>
              </div>
              <Button size="sm" onClick={updateApp} className="shrink-0">
                Update
              </Button>
              <button onClick={dismissUpdate} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Install banner
  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
      >
        <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-xl p-4 shadow-2xl shadow-primary/10">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Install VeriEdit AI</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen for the best experience</p>
            </div>
            <Button size="sm" onClick={installApp} className="shrink-0">
              Install
            </Button>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
