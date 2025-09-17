import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/hero-section";
import { VerificationUpload } from "@/components/verification-upload";
import { TrustScoreDisplay } from "@/components/trust-score-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/ui/footer";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      <Navigation 
        isAuthenticated={!!user} 
        user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} 
      />
      
      <main>
        <HeroSection />
        
        {/* Verification Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Start Your Verification
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get instant trust scores and detailed evidence for any digital content
              </p>
            </div>
            
            <VerificationUpload onVerificationStart={handleVerificationStart} />
          </div>
        </section>

        {/* Trust Score Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                AI-Powered Trust Scoring
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our advanced algorithms analyze multiple factors to give you a comprehensive trust score
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center bg-gradient-card border-border/50">
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

              <Card className="text-center bg-gradient-card border-border/50">
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

              <Card className="text-center bg-gradient-card border-border/50">
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
