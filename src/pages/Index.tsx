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
import { BackToTop } from "@/components/ui/BackToTop";
import { QuickVerifyFAB } from "@/components/ui/QuickVerifyFAB";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";

import { MobileWalletStatus } from "@/components/ui/MobileWalletStatus";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// Lazy load heavy components
const LiveActivityWidget = lazy(() => import("@/components/LiveActivityWidget").then(m => ({ default: m.LiveActivityWidget })));
const NFTShowcaseSection = lazy(() => import("@/components/nft-showcase-section").then(m => ({ default: m.NFTShowcaseSection })));
const HotClaimsWidget = lazy(() => import("@/components/viral/HotClaimsWidget").then(m => ({ default: m.HotClaimsWidget })));

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const handleVerificationStart = (data: any) => {
    if (!user) {
      sessionStorage.setItem('pendingVerification', JSON.stringify(data));
      navigate('/auth');
      return;
    }
    sessionStorage.setItem('pendingVerification', JSON.stringify(data));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgressBar />
      <Navigation />
      
      {/* Mobile Wallet Status */}
      <div className="pt-16">
        <MobileWalletStatus />
      </div>
      
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. HERO — Primary CTA */}
        <motion.div variants={sectionVariants}>
          <HeroSection />
        </motion.div>
        
        {/* 2. HOT CLAIMS — Social proof + immediate engagement */}
        <motion.section 
          variants={sectionVariants}
          id="features" 
          className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500/5 via-background to-background relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                Viral Claims: Race to Verify
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Be first to verify trending claims and earn exclusive NFT badges
              </p>
            </div>
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Skeleton className="h-60 sm:h-80" />
                <Skeleton className="h-60 sm:h-80" />
                <Skeleton className="h-60 sm:h-80 hidden lg:block" />
              </div>
            }>
              <HotClaimsWidget />
            </Suspense>
          </div>
        </motion.section>
        
        {/* 3. QUICK VERIFY — Direct conversion */}
        <motion.section 
          variants={sectionVariants}
          id="verify" 
          className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Verify Anything, Instantly
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Paste text, a URL, or upload a file — get a trust score in seconds
              </p>
            </div>
            <VerificationUpload onVerificationStart={handleVerificationStart} />
          </div>
        </motion.section>

        {/* 4. TRUST SCORING — How it works / social proof */}
        <motion.section 
          variants={sectionVariants}
          id="pricing" 
          className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                AI-Powered Trust Scoring
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Advanced algorithms analyze multiple factors for comprehensive trust scores
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="relative z-0 text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={85} showAnimation />
                  </div>
                  <CardTitle>High Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-trust-high" />
                    <Badge variant="secondary" className="text-trust-high border-trust-high/20">Verified</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Multiple credible sources confirm information with consistent data.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={65} showAnimation />
                  </div>
                  <CardTitle>Moderate Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-trust-medium" />
                    <Badge variant="secondary" className="text-trust-medium border-trust-medium/20">Review</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Additional verification recommended for accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative z-0 text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <TrustScoreDisplay score={25} showAnimation />
                  </div>
                  <CardTitle>Low Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-trust-low" />
                    <Badge variant="secondary" className="text-trust-low border-trust-low/20">Caution</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Limited sources detected. Exercise caution.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>

        {/* 5. NFT BADGES — Gamification hook */}
        <motion.section variants={sectionVariants} id="badges">
          <NFTHeroSection />
        </motion.section>

        {/* 6. VIDEO DEMO — For users who want more context */}
        <motion.div variants={sectionVariants}>
          <VideoDemoSection />
        </motion.div>

        {/* 7. NFT SHOWCASE — Collection display */}
        <Suspense fallback={
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-12 w-3/4 mx-auto" />
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

        {/* 8. LIVE ACTIVITY — Community social proof */}
        <motion.section 
          variants={sectionVariants}
          id="about" 
          className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Live Verification Feed
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Join the global fight against misinformation
              </p>
            </div>
            <Suspense fallback={
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            }>
              <LiveActivityWidget />
            </Suspense>
          </div>
        </motion.section>
      </motion.main>
      
      <Footer />
      <BackToTop />
      <QuickVerifyFAB onVerificationStart={handleVerificationStart} />
    </div>
  );
};

export default Index;