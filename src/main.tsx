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

// CRITICAL: Clean up service workers once per session
// This prevents stale JS bundles from being served on mobile devices
const SW_CLEANUP_KEY = 'sw_cleanup_session';
const currentSession = sessionStorage.getItem(SW_CLEANUP_KEY);

if (!currentSession) {
  runSwCleanup().then(() => {
    sessionStorage.setItem(SW_CLEANUP_KEY, BUILD_VERSION);
    console.log(`📱 VeriEdit AI v${BUILD_VERSION.slice(0, 10)} - Ready (cleaned)`);
  });
} else {
  console.log(`📱 VeriEdit AI v${BUILD_VERSION.slice(0, 10)} - Ready (cached)`);
}

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