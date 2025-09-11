import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';

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