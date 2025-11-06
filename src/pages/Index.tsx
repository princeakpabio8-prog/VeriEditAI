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
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16 fade-in-up">
              <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Viral Claims to Verify
              </h2>
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto font-light">
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
        <section className="py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 fade-in-up tracking-tight">
                Start Verification
              </h2>
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto fade-in-up font-light" style={{ animationDelay: '100ms' }}>
                Instant trust scores with comprehensive evidence
              </p>
            </div>
            
            <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
              <VerificationUpload onVerificationStart={handleVerificationStart} />
            </div>
          </div>
        </section>

        {/* Trust Score Preview */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 fade-in-up tracking-tight">
                AI-Powered Trust Scoring
              </h2>
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto fade-in-up font-light" style={{ animationDelay: '100ms' }}>
                Advanced algorithms analyze multiple factors for comprehensive trust scores
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
               <Card className="relative z-0 text-center backdrop-blur-md bg-card/50 border-border/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-normal fade-in-up">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={85} showAnimation />
                  </div>
                  <CardTitle className="font-display text-lg tracking-tight">High Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle className="h-4 w-4 text-trust-high" />
                    <Badge variant="secondary" className="text-trust-high border-trust-high/20 font-light">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-light leading-relaxed">
                    Multiple credible sources confirm information with consistent data.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center backdrop-blur-md bg-card/50 border-border/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-normal fade-in-up" style={{ animationDelay: '150ms' }}>
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={65} showAnimation />
                  </div>
                  <CardTitle className="font-display text-lg tracking-tight">Moderate Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-trust-medium" />
                    <Badge variant="secondary" className="text-trust-medium border-trust-medium/20 font-light">
                      Review
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-light leading-relaxed">
                    Additional verification recommended for accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center backdrop-blur-md bg-card/50 border-border/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-normal fade-in-up" style={{ animationDelay: '300ms' }}>
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={25} showAnimation />
                  </div>
                  <CardTitle className="font-display text-lg tracking-tight">Low Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-trust-low" />
                    <Badge variant="secondary" className="text-trust-low border-trust-low/20 font-light">
                      Caution
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-light leading-relaxed">
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
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Live Verification
              </h2>
              <p className="text-lg text-muted-foreground/80 font-light">
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
