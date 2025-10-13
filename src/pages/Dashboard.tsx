import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Navigation } from '@/components/ui/navigation';
import { VerificationUpload } from '@/components/verification-upload';
import { TrustScoreDisplay } from '@/components/trust-score-display';
import { Plus, Clock, CheckCircle, AlertTriangle, FileText, BarChart3, Download, Package, Trash2, Globe, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LicenseStatus } from '@/components/license-status';
import { FeatureGuard } from '@/components/feature-guard';
import { useLicense } from '@/contexts/LicenseContext';
import { VerificationAnalytics } from '@/components/verification-analytics';
import { EnhancedAnalyticsDashboard } from '@/components/enhanced-analytics-dashboard';
import { BulkVerification } from '@/components/bulk-verification';
import { useVerificationQueue } from '@/hooks/use-verification-queue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { MobileOptimizedUI } from '@/components/mobile-optimized-ui';
import { MobileButton, MobileCard } from '@/components/mobile-enhanced-form';
import { useIsMobile } from '@/hooks/use-mobile';

import { useSearchParams } from 'react-router-dom';
import { LighthouseFeed } from '@/components/lighthouse-feed';
import { ErrorBoundary } from '@/components/error-boundary';
import { VerificationErrorBoundary } from '@/components/verification-error-boundary';

// Helper function to display regions properly (maps Unknown/null to Global/International)
const displayRegion = (region: string | null | undefined): string => {
  if (!region || region === 'Unknown' || region === '') {
    return 'Global/International';
  }
  return region;
};

// Trust Intelligence Tab Component
const TrustIntelTab = () => {
  const [globalIndex, setGlobalIndex] = useState<number | null>(null);
  const [regionalData, setRegionalData] = useState<any[]>([]);
  const [topSources, setTopSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustData();
  }, []);

  const fetchTrustData = async () => {
    try {
      // Fetch trust analytics
      const { data: analytics, error } = await supabase
        .from('trust_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (analytics && analytics.length > 0) {
        // Calculate global trust index
        const avgScore = analytics.reduce((sum, item) => sum + item.average_trust_score, 0) / analytics.length;
        setGlobalIndex(Math.round(avgScore));

        // Group by region
        const regionMap = new Map();
        analytics.forEach(item => {
          if (!regionMap.has(item.region)) {
            regionMap.set(item.region, { count: 0, totalScore: 0 });
          }
          const current = regionMap.get(item.region);
          current.count += item.verification_count;
          current.totalScore += item.average_trust_score * item.verification_count;
        });

        const regions = Array.from(regionMap.entries())
          .map(([region, data]) => ({
            region,
            avgScore: Math.round(data.totalScore / data.count),
            count: data.count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setRegionalData(regions);

        // Get top sources by domain
        const domainMap = new Map();
        analytics.forEach(item => {
          if (item.domain) {
            if (!domainMap.has(item.domain)) {
              domainMap.set(item.domain, { count: 0, totalScore: 0 });
            }
            const current = domainMap.get(item.domain);
            current.count += item.verification_count;
            current.totalScore += item.average_trust_score * item.verification_count;
          }
        });

        const sources = Array.from(domainMap.entries())
          .map(([domain, data]) => ({
            domain,
            avgScore: Math.round(data.totalScore / data.count),
            count: data.count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setTopSources(sources);
      }
    } catch (error) {
      console.error('Error fetching trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shimmer">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted/70 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-12 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Global Trust Index */}
      <Card className="relative z-0 card-hover-lift bg-gradient-card border-border/50 fade-in-up" style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '0ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Global Trust Index
          </CardTitle>
          <CardDescription>Average verification trust score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary mb-2">
            {globalIndex !== null ? globalIndex : '-'}
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Live Data
          </Badge>
        </CardContent>
      </Card>

      {/* Regional Breakdown */}
      <Card className="relative z-0 card-hover-lift bg-gradient-card border-border/50 fade-in-up" style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '100ms' }}>
        <CardHeader>
          <CardTitle>Regional Breakdown</CardTitle>
          <CardDescription>Top 5 regions by verification volume</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionalData.length > 0 ? regionalData.map((item) => (
                <TableRow key={item.region}>
                  <TableCell className="font-medium">{displayRegion(item.region)}</TableCell>
                  <TableCell>
                    <Badge variant={item.avgScore >= 70 ? 'default' : 'secondary'}>
                      {item.avgScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.count}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Source Credibility Ranking */}
      <Card className="relative z-0 card-hover-lift bg-gradient-card border-border/50 md:col-span-2 fade-in-up" style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '100ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Source Credibility Ranking
          </CardTitle>
          <CardDescription>Top 10 most verified domains</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Verifications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSources.length > 0 ? topSources.map((source, idx) => (
                <TableRow key={source.domain}>
                  <TableCell className="font-bold text-primary">#{idx + 1}</TableCell>
                  <TableCell className="font-medium">{source.domain}</TableCell>
                  <TableCell>
                    <TrustScoreDisplay score={source.avgScore} size="sm" showLabel={false} showAnimation={true} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{source.count}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No source data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

interface Verification {
  id: string;
  content: string;
  content_type: string;
  status: string;
  trust_score: number | null;
  created_at: string;
  result_summary: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { incrementUsage, checkFeatureAccess } = useLicense();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [processingVerification, setProcessingVerification] = useState(false);
  const { addToQueue, queue, startQueue, getStats } = useVerificationQueue();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (user) {
      fetchVerifications();
      
      // Check for pending verification after login
      const pendingVerification = sessionStorage.getItem('pendingVerification');
      if (pendingVerification) {
        try {
          const data = JSON.parse(pendingVerification);
          sessionStorage.removeItem('pendingVerification');
          
          // Auto-start verification
          setTimeout(() => {
            handleVerificationStart(data);
          }, 500); // Small delay to ensure UI is ready
        } catch (error) {
          console.error('Error parsing pending verification:', error);
          sessionStorage.removeItem('pendingVerification');
        }
      }
    }
  }, [user]);

  const fetchVerifications = async () => {
    if (!user?.id) {
      console.warn('[Dashboard] No user ID, skipping verification fetch');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user.id) // ✅ CRITICAL FIX: Filter by user
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({
        title: "Error",
        description: "Failed to load verifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationStart = async (data: any) => {
    setProcessingVerification(true);
    
    try {
      // Redirect to Verify page to process immediately with progress UI
      sessionStorage.setItem('pendingVerification', JSON.stringify(data));
      setShowVerificationModal(false);
      setProcessingVerification(false);
      navigate('/verify');
    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to start verification",
        variant: "destructive",
      });
      setProcessingVerification(false);
    }
  };

  const handleBulkVerification = async (items: any[]) => {
    try {
      const queueItems = addToQueue(items.map(item => ({
        content: item.content,
        type: item.type,
        priority: item.priority || 'normal'
      })));

      toast({
        title: "Bulk Verification Started",
        description: `${queueItems.length} items added to processing queue.`,
      });

      await startQueue();
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error starting bulk verification:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk verification",
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('clear_user_verifications', {
        user_uuid: user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Cleared ${(data as any)?.deleted_count || 0} verification records`,
      });

      // Refresh the verifications list
      fetchVerifications();
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear verification history",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-trust-medium" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-trust-high" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-trust-low" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shimmer">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Verify content authenticity with AI-powered analysis
          </p>
        </div>

        {/* License Status */}
        <div className="mb-8">
          <LicenseStatus variant="card" />
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => navigate(`/dashboard?tab=${value}`)} className="space-y-6">
        <TabsList className={isMobile ? "grid w-full grid-cols-4 gap-1" : "grid w-full grid-cols-7"}>
          <TabsTrigger value="overview" className={isMobile ? "text-xs px-2" : ""}>Overview</TabsTrigger>
          <TabsTrigger value="discover" className={isMobile ? "text-xs px-2" : ""}>Discover</TabsTrigger>
          <TabsTrigger value="analytics" className={isMobile ? "text-xs px-2" : ""}>Analytics</TabsTrigger>
          {!isMobile && <TabsTrigger value="executive">Executive</TabsTrigger>}
          {!isMobile && <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>}
          {!isMobile && <TabsTrigger value="export">Export Data</TabsTrigger>}
          <TabsTrigger value="trust-intel" className={isMobile ? "text-xs px-2" : ""}>Trust Intel</TabsTrigger>
        </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <MobileCard 
                className="relative z-0 min-h-[100px] card-hover-lift bg-gradient-card border-border/50 fade-in-up" 
                style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '0ms' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg">Total Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {verifications.length}
                  </div>
                </CardContent>
              </MobileCard>

              <MobileCard 
                className="relative z-0 min-h-[100px] card-hover-lift bg-gradient-card border-border/50 fade-in-up" 
                style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '100ms' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg">Queue Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-trust-high">
                    {getStats().pending + getStats().processing}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Items in queue</p>
                  {(getStats().pending + getStats().processing) > 0 && (
                    <Badge className="mt-2 trust-pulse">Processing</Badge>
                  )}
                </CardContent>
              </MobileCard>

              <MobileCard 
                className="relative z-0 min-h-[100px] card-hover-lift bg-gradient-card border-border/50 fade-in-up" 
                style={{ animationDelay: typeof window !== 'undefined' && window.innerWidth < 768 ? '0ms' : '100ms' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-trust-medium">
                    {Math.round(getStats().successRate)}%
                  </div>
                </CardContent>
              </MobileCard>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <FeatureGuard 
                feature="verification"
                fallback={
                  <MobileCard className="border-amber-500/50 bg-amber-500/5 p-4 md:p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Verification Unavailable</h3>
                      <p className="text-muted-foreground mb-4 text-sm">
                        A valid license is required to use verification features.
                      </p>
                      <MobileButton onClick={() => window.location.href = '/billing'}>
                        Upgrade to Pro with Flutterwave
                      </MobileButton>
                    </div>
                  </MobileCard>
                }
              >
                <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
                  <DialogTrigger asChild>
                    <MobileButton size="lg" className="gap-2 flex-1">
                      <Plus className="h-5 w-5" />
                      New Verification
                    </MobileButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New Verification</DialogTitle>
                      <DialogDescription>
                        Submit content for AI-powered fact-checking and trust analysis
                      </DialogDescription>
                    </DialogHeader>
                    <VerificationUpload 
                      onVerificationStart={handleVerificationStart}
                      isLoading={processingVerification}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                  <DialogTrigger asChild>
                    <MobileButton variant="outline" size="lg" className="gap-2 flex-1">
                      <Package className="h-5 w-5" />
                      Bulk Verification
                    </MobileButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Bulk Verification</DialogTitle>
                      <DialogDescription>
                        Upload multiple items for batch processing
                      </DialogDescription>
                    </DialogHeader>
                    <BulkVerification onBulkStart={handleBulkVerification} />
                  </DialogContent>
                </Dialog>
              </FeatureGuard>
            </div>
          </TabsContent>

          <TabsContent key="discover" value="discover" className="space-y-6 animate-fade-in">
            <ErrorBoundary>
              <VerificationErrorBoundary>
                <LighthouseFeed />
              </VerificationErrorBoundary>
            </ErrorBoundary>
          </TabsContent>

        <TabsContent key="analytics" value="analytics" className="animate-fade-in">
          <ErrorBoundary>
            <VerificationErrorBoundary>
              <VerificationAnalytics />
            </VerificationErrorBoundary>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent key="executive" value="executive" className="animate-fade-in">
          <ErrorBoundary>
            <VerificationErrorBoundary>
              <EnhancedAnalyticsDashboard />
            </VerificationErrorBoundary>
          </ErrorBoundary>
        </TabsContent>

          <TabsContent value="bulk" className="animate-fade-in">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Bulk verification features coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="export" className="animate-fade-in">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Export features available after verifications are completed.</p>
            </div>
          </TabsContent>

          <TabsContent value="trust-intel" className="space-y-6 animate-fade-in">
            <TrustIntelTab />
          </TabsContent>
        </Tabs>

        {/* Recent Verifications */}
        <Card className="card-hover-lift bg-gradient-card border-border/50 fade-in-up" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Verifications</CardTitle>
              <CardDescription>
                Your latest content analysis results
              </CardDescription>
            </div>
            {verifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearHistory}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No verifications yet</p>
                <p className="text-sm text-muted-foreground">
                  Start by submitting your first piece of content
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={verification.content}>
                          {verification.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {verification.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(verification.status)}
                          {getStatusBadge(verification.status)}
                        </div>
                      </TableCell>
                       <TableCell>
                        {verification.trust_score !== null ? (
                          <TrustScoreDisplay 
                            score={verification.trust_score} 
                            size="sm"
                            showLabel={false}
                            showAnimation={true}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(verification.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );

  return isMobile ? (
    <MobileOptimizedUI>{content}</MobileOptimizedUI>
  ) : (
    content
  );
};

export default Dashboard;