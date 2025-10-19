import { Award, CheckCircle, Wallet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export const NFTShowcaseSection = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Earn Blockchain Rewards</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Mint Truth Badges as{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                NFTs on Polygon
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Verify claims with ≥75% trust score and mint permanent blockchain badges. 
              Own your contribution to fighting misinformation.
            </p>
          </motion.div>
        </div>

        {/* 3-Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-card border-primary/20 card-hover-lift h-full">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">1. Verify Claims</h3>
                <p className="text-muted-foreground">
                  Achieve ≥75% trust score on any content verification
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-card border-primary/20 card-hover-lift h-full">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">2. Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Link your MetaMask wallet with one click
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-card border-primary/20 card-hover-lift h-full">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">3. Mint Your Badge</h3>
                <p className="text-muted-foreground">
                  Permanent NFT proof on Polygon blockchain
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Badge Visual Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative mb-12"
        >
          <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/10 border-primary/20 overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="relative inline-block">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <img 
                    src="/src/assets/truth-badge.png" 
                    alt="Truth Badge NFT" 
                    className="w-full h-full object-contain drop-shadow-2xl animate-[spin_20s_linear_infinite]"
                    style={{ animationDirection: 'reverse' }}
                  />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-foreground">Your Truth Badge NFT</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Each badge is a unique, verifiable proof of your contribution. 
                View on PolygonScan, share on social media, and showcase in your wallet.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to={isAuthenticated ? "/dashboard?tab=badges" : "/auth?feature=nft"}>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                    <Award className="h-5 w-5" />
                    {isAuthenticated ? "View My Badges" : "Start Earning Badges"}
                  </Button>
                </Link>
                
                {!isAuthenticated && (
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="gap-2">
                      Sign Up Free
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-primary mb-2">5,000+</div>
            <div className="text-muted-foreground">Badges Minted</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">Polygon</div>
            <div className="text-muted-foreground">Mainnet Network</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">Forever</div>
            <div className="text-muted-foreground">Permanent Ownership</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
