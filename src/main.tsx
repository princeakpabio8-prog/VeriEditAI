import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <LicenseProvider>
      <App />
    </LicenseProvider>
  </AuthProvider>
);
