import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';
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
import { useVerificationAchievements } from '@/hooks/useVerificationAchievements';
import { NFTMintPromptModal } from '@/components/nft/NFTMintPromptModal';
interface VerificationState {
  stage: 'upload' | 'completed';
  content?: string;
  result?: any;
  selectedTemplate?: TemplateConfig;
  viralClaimId?: string;
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
  const location = useLocation();
  const { verify, loading, error, result } = useVerify();
  const isMobile = useIsMobile();
  const { checkAchievementsAfterVerification } = useVerificationAchievements();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    stage: 'upload'
  });
  const [nftMintPrompt, setNftMintPrompt] = useState<{
    show: boolean;
    verificationId: string;
    trustScore: number;
    claimText?: string;
  } | null>(null);

  // Handle viral claim verification from URL query parameters
  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(location.search);
      const claim = urlParams.get('claim');
      const viralClaimId = urlParams.get('viralClaimId');
      
      if (claim && viralClaimId) {
        console.log('Auto-starting verification from Hot Claims:', { viralClaimId });
        
        // Show immediate feedback
        toast.loading('Auto-verifying viral claim...', { id: 'auto-verify' });
        
        // Auto-start verification with viral claim data (reduced delay for instant feel)
        setTimeout(() => {
          handleVerificationStart({
            content: claim,
            viralClaimId,
            source: 'viral_claim'
          });
        }, 100);
        
        // Clear URL params to prevent re-triggering
        window.history.replaceState({}, document.title, '/verify');
      }
    }
  }, [user, location.search]);

  // Handle viral claim verification from navigation state
  useEffect(() => {
    if (user && location.state) {
      const { prefilledContent, viralClaimId, source } = location.state as any;
      if (prefilledContent) {
        console.log('Auto-starting verification from viral claim:', { viralClaimId });
        
        // Show immediate feedback
        toast.loading('Auto-verifying viral claim...', { id: 'auto-verify' });
        
        // Auto-start verification with viral claim data (reduced delay)
        setTimeout(() => {
          handleVerificationStart({
            content: prefilledContent,
            viralClaimId,
            source
          });
        }, 100);
        
        // Clear the state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [user, location.state]);

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

    // RACE CONDITION CHECK: Prevent duplicate verifications
    if (data.viralClaimId) {
      try {
        const { data: claimCheck } = await supabase
          .from('viral_claims')
          .select('verification_id, share_token, claim_text')
          .eq('id', data.viralClaimId)
          .single();
        
        if (claimCheck?.verification_id) {
          toast.error('🏆 Someone just beat you to it! This claim was verified moments ago.', {
            description: 'Redirecting to their verification...',
          });
          
          // Redirect to the winning verification
          if (claimCheck.share_token) {
            setTimeout(() => {
              window.location.href = `/claim/${claimCheck.share_token}`;
            }, 1500);
          }
          return; // Stop verification
        }
      } catch (error) {
        console.error('Error checking claim status:', error);
        // Continue with verification if check fails
      }
    }

    try {
      console.log('Starting instant verification...', { isMobile });
      
      // Dismiss auto-verify loading toast if present
      toast.dismiss('auto-verify');
      
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
        result: normalizedResult || result,
        viralClaimId: data.viralClaimId // Store viral claim ID for auto-minting
      });

      // Show NFT mint prompt for high-trust verifications
      if (normalizedResult?.verificationId && (normalizedResult.confidence ?? 0) >= 70) {
        try {
          const raw = localStorage.getItem('shown_nft_prompts') || sessionStorage.getItem('shown_nft_prompts') || '{}';
          const shownMap = JSON.parse(raw);
          if (!shownMap[normalizedResult.verificationId]) {
            // Trigger celebration confetti for viral claim verification
            if (data.viralClaimId) {
              // Fire confetti from multiple angles
              const duration = 3000;
              const animationEnd = Date.now() + duration;
              const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

              const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
              };

              const interval: any = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                  return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                
                // Fire from left
                confetti({
                  ...defaults,
                  particleCount,
                  origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                
                // Fire from right
                confetti({
                  ...defaults,
                  particleCount,
                  origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
              }, 250);

              // Big burst from center
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  zIndex: 9999
                });
              }, 300);

              // Success toast with celebration
              toast.success('🎉 YOU VERIFIED IT FIRST!', {
                description: 'Congratulations! You beat everyone to verify this viral claim. Claim your NFT badge now!',
                duration: 5000,
              });
            }
            
            // Show NFT prompt with slight delay to ensure verification result is visible
            setTimeout(() => {
              setNftMintPrompt({
                show: true,
                verificationId: normalizedResult.verificationId,
                trustScore: normalizedResult.confidence || 0,
                claimText: data.content,
              });
            }, 800);
            
            shownMap[normalizedResult.verificationId] = true;
            const updated = JSON.stringify(shownMap);
            sessionStorage.setItem('shown_nft_prompts', updated);
            localStorage.setItem('shown_nft_prompts', updated);
          }
        } catch (e) {
          console.warn('Failed to persist shown NFT prompt status', e);
        }
      }

      // Update viral claim with verification ID and mark as verified
      if (data.viralClaimId && normalizedResult?.verificationId) {
        try {
          const { error: updateError } = await supabase
            .from('viral_claims')
            .update({
              verification_id: normalizedResult.verificationId,
              status: 'verified',
              updated_at: new Date().toISOString()
            })
            .eq('id', data.viralClaimId);

          if (updateError) {
            console.error('Failed to update viral claim:', updateError);
          } else {
            console.log('✅ Viral claim marked as verified:', data.viralClaimId);
          }

          // Store verification context for post-verification flow
          sessionStorage.setItem('verification_completed', 'true');
          sessionStorage.setItem('verification_id', normalizedResult.verificationId);
          sessionStorage.setItem('verification_trust_score', normalizedResult.confidence?.toString() || '0');
        } catch (error) {
          console.error('Error updating viral claim:', error);
        }
      }

      // Check for achievements after successful verification
      await checkAchievementsAfterVerification();
      
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
                    viralClaimId={verificationState.viralClaimId}
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

        {nftMintPrompt && (
          <NFTMintPromptModal
            isOpen={nftMintPrompt.show}
            onClose={() => setNftMintPrompt(null)}
            verificationId={nftMintPrompt.verificationId}
            trustScore={nftMintPrompt.trustScore}
            claimText={nftMintPrompt.claimText}
          />
        )}
      </main>

      {/* Cache Status Indicator */}
      <CacheStatus />
    </div>
  );
}