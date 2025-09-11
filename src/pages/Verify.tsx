import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/contexts/LicenseContext';
import { Navigation } from '@/components/ui/navigation';
import { VerificationUpload } from '@/components/verification-upload';
import { VerificationProgress } from '@/components/verification-progress';
import { VerificationResult } from '@/components/verification-result';
import { CacheStatus } from '@/components/cache-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeatureGuard } from '@/components/feature-guard';
import { useVerificationQueue } from '@/hooks/use-verification-queue';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, Zap, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationState {
  stage: 'upload' | 'processing' | 'completed';
  verificationId?: string;
  content?: string;
  result?: any;
}

const Verify = () => {
  const { user } = useAuth();
  const { incrementUsage } = useLicense();
  const { addToQueue, startQueue } = useVerificationQueue();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    stage: 'upload'
  });

  const handleVerificationStart = async (data: any) => {
    if (!user) {
      // Store verification data for after login
      sessionStorage.setItem('pendingVerification', JSON.stringify(data));
      navigate('/auth');
      return;
    }

    try {
      // Check license usage
      const usageResult = await incrementUsage(1);
      if (!usageResult.success) {
        toast({
          title: "Usage Limit Reached",
          description: usageResult.error || "Upgrade to continue verifying content.",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/billing')}
            >
              Upgrade
            </Button>
          ),
        });
        return;
      }

      // Generate verification ID
      const verificationId = crypto.randomUUID();

      setVerificationState({
        stage: 'processing',
        verificationId,
        content: data.content
      });

      toast({
        title: "Verification Started",
        description: "Your content is being analyzed...",
      });

    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
    }
  };

  const handleVerificationComplete = (result: any) => {
    setVerificationState({
      stage: 'completed',
      verificationId: verificationState.verificationId,
      result
    });
  };

  const handleNewVerification = () => {
    setVerificationState({ stage: 'upload' });
  };

  // Desktop UI
  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Content Verification
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Submit your content for AI-powered fact-checking and trust analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {verificationState.stage === 'upload' && (
            <div className="space-y-12">
              <FeatureGuard 
                feature="verification"
                fallback={
                  <Card className="border-amber-500/50 bg-amber-500/5 p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-4">License Required</h3>
                      <p className="text-muted-foreground mb-6">
                        A valid license is required to access verification features.
                      </p>
                      <Button size="lg" onClick={() => navigate('/billing')}>
                        Get License
                      </Button>
                    </div>
                  </Card>
                }
              >
                <VerificationUpload onVerificationStart={handleVerificationStart} />
              </FeatureGuard>

              {/* How it Works */}
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-center text-foreground">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="text-center bg-gradient-card border-border/50">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Search className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">AI Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Our advanced AI models analyze your content using multiple verification techniques
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center bg-gradient-card border-border/50">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">Source Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Cross-reference with trusted sources and databases for accuracy validation
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center bg-gradient-card border-border/50">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">Instant Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Get comprehensive trust scores and detailed reports in seconds
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {verificationState.stage === 'processing' && verificationState.verificationId && verificationState.content && (
            <VerificationProgress
              verificationId={verificationState.verificationId}
              content={verificationState.content}
              onComplete={handleVerificationComplete}
              onCancel={handleNewVerification}
            />
          )}

          {verificationState.stage === 'completed' && verificationState.result && (
            <VerificationResult
              verificationId={verificationState.verificationId!}
              trustScore={verificationState.result.confidence || 0}
              status={verificationState.result.status}
              summary={verificationState.result.summary}
              sources={verificationState.result.sources || []}
              processingTime={verificationState.result.processing_time || 3000}
              onNewVerification={handleNewVerification}
              content={verificationState.content}
            />
          )}
        </div>
      </main>

      {/* Cache Status Indicator */}
      <CacheStatus />
    </div>
  );
};

export default Verify;