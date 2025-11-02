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
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-2xl animate-pulse">🔥</span>
                <span className="text-sm font-semibold text-primary">TRENDING NOW</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Hot Claims - Race to Verify First!
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
                These viral claims are spreading across social media right now. Be the first to verify them and earn exclusive NFT badges!
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
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 fade-in-up">
                Start Your Verification
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '100ms' }}>
                Get instant trust scores and detailed evidence for any digital content
              </p>
            </div>
            
            <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
              <VerificationUpload onVerificationStart={handleVerificationStart} />
            </div>
          </div>
        </section>

        {/* Trust Score Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 fade-in-up">
                AI-Powered Trust Scoring
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '100ms' }}>
                Our advanced algorithms analyze multiple factors to give you a comprehensive trust score
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
               <Card className="relative z-0 text-center bg-gradient-card border-border/50 card-hover-lift fade-in-up" style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '0ms' }}>
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={85} showAnimation />
                  </div>
                  <CardTitle className="text-lg">High Trust Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle className="h-4 w-4 text-trust-high" />
                    <Badge variant="secondary" className="text-trust-high border-trust-high/20">
                      Verified Sources
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Multiple credible sources confirm the information with consistent facts and data.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center bg-gradient-card border-border/50 card-hover-lift fade-in-up" style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '150ms' }}>
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={65} showAnimation />
                  </div>
                  <CardTitle className="text-lg">Moderate Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-trust-medium" />
                    <Badge variant="secondary" className="text-trust-medium border-trust-medium/20">
                      Needs Review
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Some sources found but additional verification recommended for complete accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center bg-gradient-card border-border/50 card-hover-lift fade-in-up" style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '300ms' }}>
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={25} showAnimation />
                  </div>
                  <CardTitle className="text-lg">Low Trust Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-trust-low" />
                    <Badge variant="secondary" className="text-trust-low border-trust-low/20">
                      Potentially Misleading
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Limited or conflicting sources detected. Exercise caution with this content.
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
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Real-Time Verification Happening Now
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of users fighting misinformation together
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
