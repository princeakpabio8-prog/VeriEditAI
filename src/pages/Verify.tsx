import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationUpload } from '@/components/verification-upload';
import { VerificationResult } from '@/components/verification-result';
import { PerformanceDashboard } from '@/components/performance-dashboard';
import { FeatureGuard } from '@/components/feature-guard';
import { CacheStatus } from '@/components/cache-status';
import { Navigation } from '@/components/ui/navigation';
import { IndustryTemplates } from '@/components/industry-templates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Shield, TrendingUp, Activity, Briefcase, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useVerify } from '@/hooks/useVerify';
import { MobileOptimizedUI } from '@/components/mobile-optimized-ui';
import { MobileVerificationUI } from '@/components/mobile-verification-ui';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizeVerifyResult } from '@/lib/normalizers';
import { ErrorBoundary } from '@/components/error-boundary';

interface VerificationState {
  stage: 'upload' | 'completed';
  content?: string;
  result?: any;
  selectedTemplate?: TemplateConfig;
}

interface TemplateConfig {
  id: string;
  name: string;
  industry: 'bank' | 'ngo';
  icon: React.ReactNode;
  description: string;
  verificationFocus: string[];
  suggestedContent: string;
}

export default function Verify() {
  const { user } = useAuth();
  const { verify, loading, error, result } = useVerify();
  const isMobile = useIsMobile();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    stage: 'upload'
  });

  // Handle pending verification from news discovery or other sources
  useEffect(() => {
    if (user) {
      const pendingVerification = sessionStorage.getItem('pendingVerification');
      if (pendingVerification) {
        try {
          const data = JSON.parse(pendingVerification);
          sessionStorage.removeItem('pendingVerification');
          
          // Auto-start verification with a small delay for UI readiness
          setTimeout(() => {
            handleVerificationStart(data);
          }, 300);
        } catch (error) {
          console.error('Error parsing pending verification:', error);
          sessionStorage.removeItem('pendingVerification');
          toast.error('Failed to load verification data');
        }
      }
    }
  }, [user]);

  const handleTemplateSelection = (template: TemplateConfig) => {
    setVerificationState({ 
      stage: 'upload',
      selectedTemplate: template 
    });
    toast.success(`${template.name} template selected - auto-populating content`);
  };

  useEffect(() => {
    if (verificationState.stage === 'completed') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [verificationState.stage]);

  const handleVerificationStart = async (data: any) => {
    if (!user) {
      toast.error('Please sign in to verify content');
      return;
    }

    try {
      console.log('Starting instant verification...', { isMobile });
      
      // Add template metadata if a template is selected
      const verificationData = {
        ...data,
        template: verificationState.selectedTemplate ? {
          id: verificationState.selectedTemplate.id,
          name: verificationState.selectedTemplate.name,
          industry: verificationState.selectedTemplate.industry,
          verificationFocus: verificationState.selectedTemplate.verificationFocus
        } : undefined
      };
      
      const fresh = await verify(data.content, user.id, isMobile, verificationData);
      
      if (fresh && (fresh as any).fromFallback) {
        toast('Showing a similar cached result due to network issues.');
      }
      
      // Normalize result before setting state to ensure safe types
      const normalizedResult = fresh ? normalizeVerifyResult(fresh) : null;
      
      setVerificationState({
        stage: 'completed',
        content: data.content,
        result: normalizedResult || result
      });
      
    } catch (error) {
      console.error('Error starting verification:', error);
      toast.error('Failed to verify content');
    }
  };

  const handleNewVerification = () => {
    setVerificationState({
      stage: 'upload',
      selectedTemplate: verificationState.selectedTemplate // Keep template selected
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

  const handleRefreshNoCache = async () => {
    if (!user) {
      toast.error('Please sign in to refresh verification');
      return;
    }
    const freshContent = verificationState.content;
    if (!freshContent || freshContent.trim().length === 0) {
      toast.error('No content to re-verify');
      return;
    }
    try {
      const fresh = await verify(freshContent, user.id, true);
      const normalizedResult = fresh ? normalizeVerifyResult(fresh) : null;
      setVerificationState((prev) => ({
        ...prev,
        stage: 'completed',
        result: normalizedResult || result
      }));
      toast.success('Refreshed with a fresh verification (no cache).');
    } catch (e) {
      toast.error('Refresh failed: ' + (e as Error).message);
    }
  };

  // Mobile-specific verification UI
  if (isMobile) {
    return (
      <MobileOptimizedUI>
        <div className="min-h-screen bg-background">
          <Navigation />
          
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Content Verification</h1>
              <p className="text-muted-foreground">
                AI-powered fact-checking and trust analysis
              </p>
            </div>

            <ErrorBoundary>
              <MobileVerificationUI
                onVerify={handleVerificationStart}
                loading={loading}
                result={result}
                error={error}
              />
            </ErrorBoundary>
          </main>
        </div>
      </MobileOptimizedUI>
    );
  }

  // Desktop UI
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
        <div className="max-w-6xl mx-auto">
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
            <Tabs defaultValue="verify" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="verify">
                  <FileText className="h-4 w-4 mr-2" />
                  Standard Verification
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Industry Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="verify" className="animate-fade-in">
                {verificationState.stage === 'upload' && (
                  <>
                    <VerificationUpload 
                      onVerificationStart={handleVerificationStart} 
                      isLoading={loading}
                      selectedTemplate={verificationState.selectedTemplate}
                    />
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
                  <div className="fade-in-up">
                    <VerificationResult
                    verificationId={(verificationState.result || result)?.verificationId || null}
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
                    industry={verificationState.selectedTemplate?.industry}
                    contradictions={(verificationState.result || result)?.contradictions}
                    related_claims={(verificationState.result || result)?.related_claims}
                  />
                  </div>
                )}

                {(verificationState.stage === 'completed' || result) && verificationState.content && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={handleRefreshNoCache}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh (no cache)
                    </Button>
                  </div>
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
              </TabsContent>

              <TabsContent value="templates" className="animate-fade-in">
                <IndustryTemplates onSelectTemplate={handleTemplateSelection} />
              </TabsContent>
            </Tabs>

            {/* How it Works - Only show on upload stage */}
            {verificationState.stage === 'upload' && (
              <div className="space-y-8 mt-12">
                <h2 className="text-3xl font-bold text-center text-foreground">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="text-center bg-gradient-card border-border/50 card-hover-lift fade-in-up" style={{ animationDelay: '0ms' }}>
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

                  <Card className="text-center bg-gradient-card border-border/50 card-hover-lift fade-in-up" style={{ animationDelay: '100ms' }}>
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

                  <Card className="text-center bg-gradient-card border-border/50 card-hover-lift fade-in-up" style={{ animationDelay: '200ms' }}>
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