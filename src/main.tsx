import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';

// Build/version stamping for diagnostics
;(window as any).__BUILD_VERSION__ = (window as any).__BUILD_VERSION__ || new Date().toISOString();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <LicenseProvider>
        <App />
        <Toaster />
      </LicenseProvider>
    </AuthProvider>
  </ErrorBoundary>
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Listen for service worker updates - notify instead of auto-reload
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available');
                
                // Show notification instead of auto-reload
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Update Available', {
                    body: 'A new version is available. Refresh to update.',
                    icon: '/favicon.ico'
                  });
                }
              }
            });
          }
        });
        
        // Check for updates every 5 minutes on mobile (not 10 seconds)
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setInterval(() => {
            registration.update().catch(() => {}); // Silent update check
          }, 5 * 60 * 1000); // Check every 5 minutes
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('Service worker updated to version:', event.data.version);
      }
    });
  });
}