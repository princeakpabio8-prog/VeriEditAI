import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/error-boundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { AchievementNotification } from "./components/AchievementNotification";
import { MobileLoadingSkeleton } from "./components/MobileLoadingSkeleton";

// Critical pages - loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

// Heavy pages - lazy loaded
const NFTMarketplace = lazy(() => import("./pages/NFTMarketplace"));
const TrustOracle = lazy(() => import("./pages/TrustOracle"));
const ViralClaims = lazy(() => import("./pages/ViralClaims"));
const ActivityFeed = lazy(() => import("./pages/ActivityFeed"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RoyaltyDashboard = lazy(() => import("./pages/RoyaltyDashboard"));
const BountyMarketplace = lazy(() => import("./pages/BountyMarketplace"));

// Medium pages - lazy loaded
const Profile = lazy(() => import("./pages/Profile"));
const Billing = lazy(() => import("./pages/Billing"));
const License = lazy(() => import("./pages/License"));
const Verify = lazy(() => import("./pages/Verify"));
const Achievements = lazy(() => import("./pages/Achievements"));
const ApiHub = lazy(() => import("./pages/ApiHub"));
const Referrals = lazy(() => import("./pages/Referrals"));
const FindUsers = lazy(() => import("./pages/FindUsers"));

// Light pages - lazy loaded
const About = lazy(() => import("./pages/About"));
const Demo = lazy(() => import("./pages/Demo"));
const Extensions = lazy(() => import("./pages/Extensions"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Press = lazy(() => import("./pages/Press"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Shared pages
const ShareVerification = lazy(() => import("./pages/ShareVerification"));
const ShareThread = lazy(() => import("./pages/ShareThread"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));

// Lighthouse pages
const LighthouseHub = lazy(() => import("./pages/LighthouseHub"));
const LighthouseRoomView = lazy(() => import("./pages/LighthouseRoomView"));
const ThreadView = lazy(() => import("./pages/ThreadView"));
const SignalFeed = lazy(() => import("./pages/SignalFeed"));

// User pages
const UserProfile = lazy(() => import("./pages/UserProfile"));
const ActivityDetail = lazy(() => import("./pages/ActivityDetail"));

// Component pages
const VerificationDashboard = lazy(() => import("./components/VerificationDashboard"));
const OrganizationProfile = lazy(() => import("./components/partnership/OrganizationProfile").then(m => ({ default: m.OrganizationProfile })));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const ApiOpenApiDocs = lazy(() => import("./pages/ApiOpenApiDocs"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AchievementNotification />
          <MobileBottomNav />
          <Suspense fallback={<MobileLoadingSkeleton variant="card" count={3} />}>
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
              <Route path="/share/:shareToken" element={<ShareVerification />} />
              <Route path="/thread/share/:shareToken" element={<ShareThread />} />
              <Route path="/lighthouse" element={<LighthouseHub />} />
              <Route path="/lighthouse/:roomId" element={<LighthouseRoomView />} />
              <Route path="/lighthouse/:roomId/thread/:threadId" element={<ThreadView />} />
              <Route path="/lighthouse/organizations/:orgId" element={<OrganizationProfile />} />
              <Route path="/activity-feed" element={<ActivityFeed />} />
              <Route path="/lighthouse/activity/:activityId" element={<ActivityDetail />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/api/docs" element={<ApiOpenApiDocs />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/find-users" element={<ProtectedRoute><FindUsers /></ProtectedRoute>} />
              <Route path="/press" element={<Press />} />
              <Route path="/viral-claims" element={<ViralClaims />} />
              <Route path="/signal-feed" element={<SignalFeed />} />
              <Route path="/achievements" element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              } />
              <Route path="/nft-marketplace" element={<NFTMarketplace />} />
              <Route path="/royalties" element={
                <ProtectedRoute>
                  <RoyaltyDashboard />
                </ProtectedRoute>
              } />
              <Route path="/trust-oracle" element={<TrustOracle />} />
              <Route path="/bounties" element={<BountyMarketplace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
