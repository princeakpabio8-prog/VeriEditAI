import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/hero-section";
import { VideoDemoSection } from "@/components/video-demo-section";
import { VerificationUpload } from "@/components/verification-upload";
import { TrustScoreDisplay } from "@/components/trust-score-display";
import { NFTHeroSection } from "@/components/nft/NFTHeroSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/ui/footer";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy components
const LiveActivityWidget = lazy(() => import("@/components/LiveActivityWidget").then(m => ({ default: m.LiveActivityWidget })));
const NFTShowcaseSection = lazy(() => import("@/components/nft-showcase-section").then(m => ({ default: m.NFTShowcaseSection })));
const HotClaimsWidget = lazy(() => import("@/components/viral/HotClaimsWidget").then(m => ({ default: m.HotClaimsWidget })));

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVerificationStart = (data: any) => {
    if (!user) {
      // Store verification data in sessionStorage for after login
      sessionStorage.setItem('pendingVerification', JSON.stringify(data));
      navigate('/auth');
      return;
    }
    // User is logged in, redirect to dashboard to process verification
    sessionStorage.setItem('pendingVerification', JSON.stringify(data));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        <HeroSection />
        
        {/* NFT Hero Section - Mobile-first badge discovery */}
        <NFTHeroSection />
        
        <VideoDemoSection />
        
        {/* Hot Claims - Race to Verify Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12 fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Viral Claims to Verify
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Be first to verify trending claims and earn exclusive NFT badges
              </p>
            </div>
            
            <Suspense fallback={
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-80" />
                  <Skeleton className="h-80" />
                  <Skeleton className="h-80" />
                </div>
              </div>
            }>
              <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
                <HotClaimsWidget />
              </div>
            </Suspense>
          </div>
        </section>
        
        {/* Verification Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 fade-in-up">
                Start Verification
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '100ms' }}>
                Instant trust scores with comprehensive evidence
              </p>
            </div>
            
            <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
              <VerificationUpload onVerificationStart={handleVerificationStart} />
            </div>
          </div>
        </section>

        {/* Trust Score Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 fade-in-up">
                AI-Powered Trust Scoring
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '100ms' }}>
                Advanced algorithms analyze multiple factors for comprehensive trust scores
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="relative z-0 text-center fade-in-up">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={85} showAnimation />
                  </div>
                  <CardTitle>High Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-trust-high" />
                    <Badge variant="secondary" className="text-trust-high border-trust-high/20">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Multiple credible sources confirm information with consistent data.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center fade-in-up" style={{ animationDelay: '150ms' }}>
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={65} showAnimation />
                  </div>
                  <CardTitle>Moderate Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-trust-medium" />
                    <Badge variant="secondary" className="text-trust-medium border-trust-medium/20">
                      Review
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Additional verification recommended for accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center fade-in-up" style={{ animationDelay: '300ms' }}>
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={25} showAnimation />
                  </div>
                  <CardTitle>Low Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-trust-low" />
                    <Badge variant="secondary" className="text-trust-low border-trust-low/20">
                      Caution
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Limited sources detected. Exercise caution.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* NFT Showcase Section */}
        <Suspense fallback={
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            </div>
          </section>
        }>
          <NFTShowcaseSection />
        </Suspense>

        {/* Live Activity Widget Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Live Verification
              </h2>
              <p className="text-lg text-muted-foreground">
                Join the fight against misinformation
              </p>
            </div>
            
            <Suspense fallback={
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            }>
              <LiveActivityWidget />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
