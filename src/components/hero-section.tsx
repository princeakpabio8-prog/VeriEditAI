import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Award, Users, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import lighthouseHero from "@/assets/lighthouse-hero.jpg";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-24 sm:pt-0 sm:pb-0">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 will-change-transform transition-transform duration-[1500ms] ease-out"
        style={{
          transform: isMobile 
            ? (mounted ? 'scale(1)' : 'scale(1.1)')
            : `translateY(${scrollY * 0.4}px) scale(${mounted ? 1 : 1.1})`,
        }}
      >
        <img
          src={lighthouseHero}
          alt="Lighthouse beacon representing truth and verification"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Lighthouse Beam Effect */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-lighthouse-glow rounded-full blur-3xl lighthouse-beam opacity-30" />

      {/* Content */}
      <div 
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-opacity duration-300"
        style={{
          opacity: Math.max(0, 1 - scrollY / 400),
        }}
      >
        <div className="fade-in-up">
          <h1 className="text-[2.5rem] sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] sm:leading-tight tracking-tight">
            <span className="bg-gradient-trust bg-clip-text text-transparent block">
              Trust Infrastructure
            </span>
            <span className="text-foreground block mt-1">for the AI Era</span>
          </h1>
          
          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto px-2 leading-relaxed">
            AI-powered verification that delivers instant trust scores and comprehensive evidence for any digital content.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-16 px-4">
            <Link to="/verify" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group">
                Start Verification
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/lighthouse" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                <Radio className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Explore Lighthouse
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto px-2">
            <div className="text-center trust-pulse">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">99.9%</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Accuracy</p>
            </div>
            
            <div className="text-center trust-pulse" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">10K+</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Users</p>
            </div>
            
            <div className="text-center trust-pulse" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">3K+</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Badges</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};