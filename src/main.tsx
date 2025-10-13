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

// Register service worker for PWA functionality with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Listen for service worker updates and auto-reload
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available - preparing to update');
                
                // Tell the new SW to skip waiting
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
        
        // Check for updates periodically on mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          setInterval(() => {
            registration.update().catch(() => {}); // Silent update check
          }, 5 * 60 * 1000); // Check every 5 minutes
        }
        
        // Version check on mount to force update if needed
        fetch('/sw-version')
          .then(res => res.json())
          .then(data => {
            const storedVersion = localStorage.getItem('sw_version');
            if (storedVersion && storedVersion !== data.version) {
              console.log('SW version changed, forcing update');
              registration.update();
            }
            localStorage.setItem('sw_version', data.version);
          })
          .catch(() => {});
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });

    // Listen for controller change and reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        console.log('New service worker activated - reloading page');
        refreshing = true;
        window.location.reload();
      }
    });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_READY') {
        console.log('Service worker ready, version:', event.data.version);
      }
    });
  });
}