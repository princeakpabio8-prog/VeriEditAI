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
import AdminDashboard from "./pages/AdminDashboard";
import ShareVerification from "./pages/ShareVerification";
import ShareThread from "./pages/ShareThread";
import Extensions from "./pages/Extensions";
import Referrals from "./pages/Referrals";
import ApiHub from "./pages/ApiHub";
import Privacy from "./pages/Privacy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import LighthouseHub from "./pages/LighthouseHub";
import LighthouseRoomView from "./pages/LighthouseRoomView";
import ThreadView from "./pages/ThreadView";
import ApiDocs from "./pages/ApiDocs";
import { OrganizationProfile } from "./components/partnership/OrganizationProfile";
import { MobileBottomNav } from "./components/ui/MobileBottomNav";
import UserProfile from "./pages/UserProfile";
import FindUsers from "./pages/FindUsers";
import ActivityFeed from "./pages/ActivityFeed";
import ActivityDetail from "./pages/ActivityDetail";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MobileBottomNav />
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
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/about" element={<About />} />
            <Route path="/extensions" element={<Extensions />} />
            <Route path="/api" element={<ProtectedRoute><ApiHub /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/referrals" element={
              <ProtectedRoute>
                <Referrals />
              </ProtectedRoute>
            } />
            <Route path="/payment-callback" element={<PaymentCallback />} />
            {/* Public routes for sharing - no auth required */}
            <Route path="/share/:shareToken" element={<ShareVerification />} />
            <Route path="/thread/share/:shareToken" element={<ShareThread />} />
            <Route path="/lighthouse" element={<LighthouseHub />} />
            <Route path="/lighthouse/:roomId" element={<LighthouseRoomView />} />
            <Route path="/lighthouse/:roomId/thread/:threadId" element={<ThreadView />} />
            <Route path="/lighthouse/organizations/:orgId" element={<OrganizationProfile />} />
            <Route path="/activity-feed" element={<ActivityFeed />} />
            <Route path="/lighthouse/activity/:activityId" element={<ActivityDetail />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/find-users" element={<ProtectedRoute><FindUsers /></ProtectedRoute>} />
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
