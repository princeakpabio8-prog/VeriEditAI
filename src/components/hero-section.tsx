import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Award, Users, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import lighthouseHero from "@/assets/lighthouse-hero.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
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
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="fade-in-up">
          <h1 className="font-display text-6xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tighter">
            <span className="bg-gradient-trust bg-clip-text text-transparent drop-shadow-lg">
              Trust Infrastructure
            </span>
            <br />
            <span className="text-foreground">for the AI Era</span>
          </h1>
          
          <p className="font-sans text-lg md:text-xl text-muted-foreground/90 mb-16 max-w-2xl mx-auto leading-relaxed font-light">
            AI-powered verification that delivers instant trust scores and comprehensive evidence for any digital content.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-24">
            <Link to="/verify">
              <Button size="lg" className="text-base px-10 py-7 group transition-all duration-normal hover:scale-105 hover:shadow-2xl">
                Start Verification
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-fast" />
              </Button>
            </Link>
            <Link to="/lighthouse">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base px-10 py-7 backdrop-blur-md bg-background/30 border-2 hover:bg-background/50 transition-all duration-normal"
              >
                <Radio className="mr-2 h-5 w-5" />
                Explore Lighthouse
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl mx-auto">
            <div className="text-center trust-pulse backdrop-blur-sm bg-background/20 rounded-2xl p-8 border border-border/50">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mb-2">99.9%</h3>
              <p className="text-sm text-muted-foreground/80 font-light tracking-wide">Accuracy Rate</p>
            </div>
            
            <div className="text-center trust-pulse backdrop-blur-sm bg-background/20 rounded-2xl p-8 border border-border/50" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mb-2">10K+</h3>
              <p className="text-sm text-muted-foreground/80 font-light tracking-wide">Trusted Users</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};