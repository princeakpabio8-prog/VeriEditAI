import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import { Web3Provider } from '@/contexts/Web3Context';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { runSwCleanup } from '@/lib/sw-cleanup';

// Build/version stamping for diagnostics
const BUILD_VERSION = new Date().toISOString();
(window as any).__BUILD_VERSION__ = BUILD_VERSION;

// CRITICAL: Clean up service workers and caches on app start
// This prevents stale JS bundles from being served on mobile devices
runSwCleanup().then(() => {
  console.log(`📱 VeriEdit AI v${BUILD_VERSION.slice(0, 10)} - Ready`);
  
  // Warn if SW is still detected after cleanup (shouldn't happen)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.warn('⚠️ Service Worker still active after cleanup - hard reload may be needed');
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <LicenseProvider>
        <Web3Provider>
          <App />
          <Toaster />
        </Web3Provider>
      </LicenseProvider>
    </AuthProvider>
  </ErrorBoundary>
);

// SERVICE WORKER DISABLED
// Previously caused stale bundle issues on mobile - removed for stability
// If PWA features are needed later, re-enable with proper versioning and cache busting