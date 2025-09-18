import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isSupported: boolean;
  isStandalone: boolean;
  updateAvailable: boolean;
}

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [status, setStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isSupported: 'serviceWorker' in navigator,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    updateAvailable: false
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isNavigatorStandalone;
      
      setStatus(prev => ({
        ...prev,
        isInstalled,
        isStandalone
      }));
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setStatus(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setStatus(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false
      }));
      setInstallPrompt(null);
      toast({
        title: "App Installed!",
        description: "You can now use the app from your home screen",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

useEffect(() => {
  // Register service worker and check for updates
  if (!('serviceWorker' in navigator)) return;

  let reloaded = false;
  const handleControllerChange = () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        try { reg?.update(); } catch (e) { console.debug('SW update check failed', e); }
      });
    }
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered successfully');

      // Immediately check for updates
      try { registration.update(); } catch (e) { console.debug('SW update check failed', e); }

      // Also check when tab becomes visible
      document.addEventListener('visibilitychange', onVisibility);

      // Listen for new updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setStatus(prev => ({ ...prev, updateAvailable: true }));
              toast({
                title: "Update Available",
                description: "A new version of the app is ready to install",
                action: (
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
                  >
                    Update
                  </button>
                ),
              });
            }
          });
        }
      });
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}, [toast]);

  const installApp = async (): Promise<boolean> => {
    if (!installPrompt) {
      // Fallback instructions for manual installation
      toast({
        title: "Install App",
        description: "Use your browser's 'Add to Home Screen' option to install the app",
      });
      return false;
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "Installing...",
          description: "The app is being installed to your device",
        });
        return true;
      } else {
        toast({
          title: "Installation Cancelled",
          description: "You can install the app later from the browser menu",
        });
        return false;
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: "Installation Failed",
        description: "There was an error installing the app",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const shareApp = async (data?: { title?: string; text?: string; url?: string }) => {
    const shareData = {
      title: data?.title || 'AI Verification Platform',
      text: data?.text || 'Check out this AI-powered content verification platform',
      url: data?.url || window.location.origin
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Thank you for sharing the app!",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied",
          description: "App link copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Share",
          description: `Share this link: ${shareData.url}`,
        });
      }
    }
  };

  // Get install instructions based on device/browser
  const getInstallInstructions = (): string => {
    const userAgent = navigator?.userAgent?.toLowerCase();
    
    if (!userAgent) {
      return "Use your browser's 'Add to Home Screen' or 'Install App' option";
    }
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return "Tap the Share button and select 'Add to Home Screen'";
    } else if (userAgent.includes('android')) {
      return "Tap the menu button and select 'Add to Home Screen' or 'Install App'";
    } else if (userAgent.includes('chrome')) {
      return "Click the install button in the address bar or use the browser menu";
    } else if (userAgent.includes('firefox')) {
      return "Use the browser menu and select 'Install This Site as an App'";
    } else if (userAgent.includes('safari')) {
      return "Use the Share menu and select 'Add to Home Screen'";
    } else {
      return "Use your browser's 'Add to Home Screen' or 'Install App' option";
    }
  };

  // Check if running in PWA mode
  const isPWAMode = (): boolean => {
    return status.isStandalone || status.isInstalled;
  };

  // Get PWA display mode
  const getDisplayMode = (): string => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    } else if (window.matchMedia('(display-mode: browser)').matches) {
      return 'browser';
    } else {
      return 'unknown';
    }
  };

  return {
    status,
    installApp,
    updateApp,
    shareApp,
    getInstallInstructions,
    isPWAMode,
    getDisplayMode,
    isInstallable: status.isInstallable && !!installPrompt,
    isUpdateAvailable: status.updateAvailable
  };
};