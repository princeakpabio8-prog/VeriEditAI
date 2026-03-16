import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '@/hooks/use-toast';
import { lower } from '@/lib/string';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('✅ SW registered:', swUrl);
      // Check for updates every 60 minutes
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('❌ SW registration error:', error);
    },
  });

  const isStandalone = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     (window.navigator as any).standalone === true);

  useEffect(() => {
    setIsInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast({ title: "App Installed!", description: "VeriEdit AI is now on your home screen" });
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isStandalone, toast]);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      toast({
        title: "Install VeriEdit AI",
        description: getInstallInstructions(),
      });
      return false;
    }
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      return result.outcome === 'accepted';
    } catch {
      return false;
    }
  }, [installPrompt, toast]);

  const updateApp = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const isInstallable = !!installPrompt && !isInstalled;
  const isUpdateAvailable = needRefresh;

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isUpdateAvailable,
    installApp,
    updateApp,
    dismissUpdate,
    getInstallInstructions,
  };
};

function getInstallInstructions(): string {
  const ua = lower(navigator?.userAgent ?? '');
  if (ua.includes('iphone') || ua.includes('ipad')) {
    return "Tap the Share button ↗ then 'Add to Home Screen'";
  } else if (ua.includes('android')) {
    return "Tap ⋮ menu then 'Add to Home Screen' or 'Install App'";
  } else if (ua.includes('chrome')) {
    return "Click the install icon in the address bar";
  } else {
    return "Use your browser menu → 'Install App' or 'Add to Home Screen'";
  }
}
