import { Award, TrendingUp, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BadgePreview } from './BadgePreview';
import { NFTOnboardingFlow } from './NFTOnboardingFlow';
import { useState, useEffect } from 'react';

export function NFTHeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Auto-show onboarding for first-time users
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('nft_onboarding_completed');
    if (!hasSeenOnboarding && !user) {
      // Delay to not interrupt initial page load
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleGetStarted = () => {
    const hasSeenOnboarding = localStorage.getItem('nft_onboarding_completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    } else if (!user) {
      navigate('/auth?feature=nft');
    } else {
      navigate('/verify');
    }
  };

  const handleLearnMore = () => {
    localStorage.removeItem('nft_onboarding_completed'); // Allow re-viewing
    setShowOnboarding(true);
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Info */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-md">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Earn NFT Badges</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Turn Truth Into
              <span className="block text-accent">
                Digital Collectibles
              </span>
            </h2>

            <p className="text-lg text-muted-foreground">
              Every verified claim you check becomes a unique NFT badge on the Polygon blockchain. Collect rare tiers, trade on OpenSea, and build your reputation as a truth verifier.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-card border-border">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">72</p>
                <p className="text-xs text-muted-foreground">Badges Minted</p>
              </Card>
              <Card className="p-4 text-center bg-card border-border">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">5</p>
                <p className="text-xs text-muted-foreground">Rarity Tiers</p>
              </Card>
              <Card className="p-4 text-center bg-card border-border">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">48</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="font-medium"
              >
                {user ? 'Start Earning Badges' : 'Get Started Free'}
              </Button>
              {!user && (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleLearnMore}
                >
                  How It Works
                </Button>
              )}
              {user && (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  Preview Badge
                </Button>
              )}
            </div>
          </div>

          {/* Right: Badge Preview */}
          <div className="fade-in-up">
            {showPreview ? (
              <BadgePreview 
                trustScore={85}
                claimText="Sample verified claim showing what your NFT badge could look like"
                showMintButton={false}
              />
            ) : (
              <div className="relative">
                <img 
                  src="/nft-badge-template.png" 
                  alt="Truth Badge NFT Example"
                  className="relative z-10 w-full h-auto rounded-md"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card border-border">
            <div className="w-12 h-12 bg-secondary rounded-md flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Verify Content</h3>
            <p className="text-sm text-muted-foreground">
              Submit any claim for AI-powered fact-checking. Get a trust score based on credible sources.
            </p>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="w-12 h-12 bg-secondary rounded-md flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Earn NFT Badge</h3>
            <p className="text-sm text-muted-foreground">
              High trust scores (70%+) unlock unique NFT badges. Higher scores = rarer badges!
            </p>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="w-12 h-12 bg-secondary rounded-md flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Collect & Trade</h3>
            <p className="text-sm text-muted-foreground">
              View your collection, trade on OpenSea, and climb the leaderboard as a top verifier.
            </p>
          </Card>
        </div>
      </div>

      {/* Onboarding Flow Modal */}
      <NFTOnboardingFlow 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </section>
  );
}
