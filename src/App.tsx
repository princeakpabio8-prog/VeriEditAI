import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/error-boundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import License from "./pages/License";
import Verify from "./pages/Verify";
import About from "./pages/About";
import PaymentCallback from "./pages/PaymentCallback";
import NotFound from "./pages/NotFound";
import VerificationDashboard from "./components/VerificationDashboard";
import Demo from "./pages/Demo";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/demo" element={<Demo />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/license" 
              element={
                <ProtectedRoute>
                  <License />
                </ProtectedRoute>
              } 
            />
          <Route path="/verify" element={
            <ProtectedRoute>
              <Verify />
            </ProtectedRoute>
          } />
            <Route 
              path="/verification-dashboard" 
              element={
                <ProtectedRoute>
                  <VerificationDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/about" element={<About />} />
            <Route path="/payment-callback" element={<PaymentCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
