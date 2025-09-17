import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationUpload } from '@/components/verification-upload';
import { VerificationResult } from '@/components/verification-result';
import { PerformanceDashboard } from '@/components/performance-dashboard';
import { FeatureGuard } from '@/components/feature-guard';
import { CacheStatus } from '@/components/cache-status';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Shield, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useVerify } from '@/hooks/useVerify';
import { MobileOptimizedUI } from '@/components/mobile-optimized-ui';
import { MobileVerificationUI } from '@/components/mobile-verification-ui';
import { useIsMobile } from '@/hooks/use-mobile';

interface VerificationState {
  stage: 'upload' | 'completed';
  content?: string;
  result?: any;
}

export default function Verify() {
  const { user } = useAuth();
  const { verify, loading, error, result } = useVerify();
  const isMobile = useIsMobile();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    stage: 'upload'
  });

  const handleVerificationStart = async (data: any) => {
    if (!user) {
      toast.error('Please sign in to verify content');
      return;
    }

    try {
      console.log('Starting instant verification...');
      await verify(data.content, user.id, false, data);
      
      setVerificationState({
        stage: 'completed',
        content: data.content,
        result: result
      });
      
    } catch (error) {
      console.error('Error starting verification:', error);
      toast.error('Failed to verify content');
    }
  };

  const handleNewVerification = () => {
    setVerificationState({
      stage: 'upload'
    });
  };

  const handleHealthCheck = async () => {
    if (!user) {
      toast.error('Please sign in to run health check');
      return;
    }
    
    const testContent = "The Earth is round and orbits the Sun.";
    try {
      await verify(testContent, user.id, true); // bypass cache for health check
      toast.success('Health check passed! Verification system is working.');
    } catch (error) {
      toast.error('Health check failed: ' + (error as Error).message);
    }
  };

  // Mobile-specific verification UI
  if (isMobile) {
    return (
      <MobileOptimizedUI>
        <div className="min-h-screen bg-background">
          <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} />
          
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Content Verification</h1>
              <p className="text-muted-foreground">
                AI-powered fact-checking and trust analysis
              </p>
            </div>

            <MobileVerificationUI
              onVerify={handleVerificationStart}
              loading={loading}
              result={result}
              error={error}
            />
          </main>
        </div>
      </MobileOptimizedUI>
    );
  }

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
          <FeatureGuard 
            feature="verification"
            fallback={
              <Card className="border-amber-500/50 bg-amber-500/5 p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">License Required</h3>
                  <p className="text-muted-foreground mb-6">
                    A valid license is required to access verification features.
                  </p>
                  <Button size="lg" onClick={() => window.location.href = '/billing'}>
                    Get License
                  </Button>
                </div>
              </Card>
            }
          >
            {verificationState.stage === 'upload' && (
              <>
                <VerificationUpload onVerificationStart={handleVerificationStart} isLoading={loading} />
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleHealthCheck}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Health Check
                  </Button>
                </div>
              </>
            )}
            
            {(verificationState.stage === 'completed' || result) && (
              <VerificationResult
                verificationId={`instant_${Date.now()}`}
                trustScore={(verificationState.result || result)?.confidence || 0}
                status={(verificationState.result || result)?.status || 'unknown'}
                summary={(verificationState.result || result)?.summary || 'No summary available'}
                analysis={(verificationState.result || result)?.analysis || 'No analysis available'}
                sources={((verificationState.result || result)?.sources || []).map((s: any) => ({
                  id: s.id || Math.random().toString(),
                  title: s.title || 'Unknown Source',
                  url: s.url || '#',
                  content_snippet: s.content_snippet || s.snippet || '',
                  reliability_score: s.reliability_score || undefined,
                }))}
                sourceConsensus={(verificationState.result || result)?.source_consensus || 0}
                methods={(verificationState.result || result)?.verification_method || ['AI Analysis']}
                category={(verificationState.result || result)?.category || 'general'}
                processingTime={1500}
                onNewVerification={handleNewVerification}
                content={verificationState.content || 'No content'}
              />
            )}
            
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">Verification Error</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNewVerification}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* How it Works - Only show on upload stage */}
            {verificationState.stage === 'upload' && (
              <div className="space-y-8 mt-12">
                <h2 className="text-3xl font-bold text-center text-foreground">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="text-center bg-gradient-card border-border/50">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
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
                          <CheckCircle className="h-6 w-6 text-primary" />
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
            )}
            {/* Performance Dashboard - Only show on upload stage */}
            {verificationState.stage === 'upload' && (
              <div className="mt-12">
                <PerformanceDashboard />
              </div>
            )}
          </FeatureGuard>
        </div>
      </main>

      {/* Cache Status Indicator */}
      <CacheStatus />
    </div>
  );
}