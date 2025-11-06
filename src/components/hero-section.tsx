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
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 sm:pt-0">
        <div className="fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-trust bg-clip-text text-transparent">
              Trust Infrastructure
            </span>
            <br />
            <span className="text-foreground">for the AI Era</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            AI-powered verification that delivers instant trust scores and comprehensive evidence for any digital content.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/verify">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Start Verification
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/lighthouse">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Radio className="mr-2 h-5 w-5" />
                Explore Lighthouse
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center trust-pulse">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">99.9%</h3>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
            
            <div className="text-center trust-pulse" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">10K+</h3>
              <p className="text-sm text-muted-foreground">Trusted Users</p>
            </div>
            
            <div className="text-center trust-pulse" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">3K+</h3>
              <p className="text-sm text-muted-foreground">NFT Badges Minted</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};