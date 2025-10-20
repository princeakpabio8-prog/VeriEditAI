import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, CheckCircle, XCircle, ExternalLink, RefreshCw, Flame, Users, Clock, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ShareModal } from '@/components/share-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ViralClaim {
  id: string;
  claim_text: string;
  platform: string;
  source_url: string;
  author: string;
  engagement_score: number;
  engagement_velocity: number;
  first_seen_at: string;
  status: string;
  metadata: any;
  image_url?: string | null;
  verification_id?: string | null;
  share_token?: string | null;
}

export default function ViralClaims() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [claims, setClaims] = useState<ViralClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'monitoring'>('all');
  const [triggering, setTriggering] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const checkAdminAccess = async () => {
      const isAdmin = await hasRole('admin');
      if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'This page is only accessible to administrators.',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    checkAdminAccess();
    fetchViralClaims();

    // Set up realtime subscription
    const channel = supabase
      .channel('viral-claims-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viral_claims' }, () => {
        fetchViralClaims();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, hasRole]);

  async function fetchViralClaims() {
    try {
      let query = supabase
        .from('viral_claims')
        .select('*')
        .order('engagement_velocity', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'critical') {
          query = query.gte('engagement_score', 1000).eq('status', 'monitoring');
        } else if (filter === 'high') {
          query = query.gte('engagement_score', 500).lt('engagement_score', 1000).eq('status', 'monitoring');
        } else {
          query = query.eq('status', filter);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      const results = data || [];
      setClaims(results);

      // If no claims found, auto-trigger monitoring once
      if (results.length === 0 && !autoTriggered) {
        setAutoTriggered(true);
        try {
          await triggerMonitoring();
        } catch (e) {
          console.error('Auto-trigger monitoring failed', e);
        }
      }
    } catch (error) {
      console.error('Error fetching viral claims:', error);
      toast({
        title: 'Error',
        description: 'Failed to load viral claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    
    // Trigger RSS feed fetch
    try {
      await supabase.functions.invoke('fetch-rss-news');
      await fetchViralClaims();
      
      toast({
        title: 'Refreshed',
        description: 'Viral claims updated successfully',
      });
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh feeds',
        variant: 'destructive',
      });
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchViralClaims();
  }, [filter]);

  function getAlertLevel(claim: ViralClaim): 'critical' | 'high' | 'normal' {
    const hoursSinceFirstSeen = (Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60);
    
    if (claim.engagement_score >= 1000 && hoursSinceFirstSeen < 6) {
      return 'critical';
    } else if (claim.engagement_score >= 1000 && hoursSinceFirstSeen < 24) {
      return 'high';
    } else if (claim.engagement_velocity > 100) {
      return 'high';
    }
    return 'normal';
  }

  function handleVerifyNow(claim: ViralClaim) {
    navigate('/verify', { 
      state: { 
        prefilledContent: claim.claim_text,
        viralClaimId: claim.id,
        source: claim.source_url 
      } 
    });
  }

  async function triggerMonitoring() {
    setTriggering(true);
    try {
      const functions = ['monitor-youtube', 'fetch-rss-news', 'calculate-virality'];
      
      for (const func of functions) {
        const { error } = await supabase.functions.invoke(func);
        if (error) {
          console.error(`Error invoking ${func}:`, error);
        }
      }

      toast({
        title: 'Monitoring Triggered',
        description: 'All monitoring functions have been invoked. Claims should populate shortly.',
      });

      // Refresh claims after a delay
      setTimeout(() => {
        fetchViralClaims();
      }, 3000);
    } catch (error) {
      console.error('Error triggering monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger monitoring functions',
        variant: 'destructive',
      });
    } finally {
      setTriggering(false);
    }
  }

  const stats = {
    total: claims.length,
    critical: claims.filter(c => getAlertLevel(c) === 'critical').length,
    high: claims.filter(c => getAlertLevel(c) === 'high').length,
    monitoring: claims.filter(c => c.status === 'monitoring').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Viral Claims Monitor</h1>
                <p className="text-muted-foreground">Track and verify claims spreading across social media</p>
              </div>
              {!isMobile && (
                <Button 
                  onClick={triggerMonitoring} 
                  disabled={triggering}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${triggering ? 'animate-spin' : ''}`} />
                  {triggering ? 'Updating...' : 'Trigger Monitoring'}
                </Button>
              )}
            </div>
            {isMobile && (
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing || loading}
                className="w-full gap-2"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing Feeds...' : 'Refresh Latest Claims'}
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Claims</p>
                  <p className="text-2xl font-bold">{stats.monitoring}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </Card>
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </Card>
            <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Alert</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.high}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tracked</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </Card>
          </div>

          {/* Filters - Sticky */}
          <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-6">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all">All Claims</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="high">High Alert</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Claims Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              <Card className="p-8 text-center col-span-full">
                <p className="text-muted-foreground">Loading viral claims...</p>
              </Card>
            ) : claims.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <p className="text-muted-foreground">No viral claims found</p>
              </Card>
            ) : (
              claims.map((claim) => {
                const alertLevel = getAlertLevel(claim);
                const hoursSinceFirstSeen = ((Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60)).toFixed(1);
                
                return (
                  <Card 
                    key={claim.id} 
                    className={cn(
                      "p-4 transition-all hover:shadow-lg hover:scale-[1.02] min-h-[200px]",
                      !!claim.verification_id ? 'border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' :
                      alertLevel === 'critical' ? 'border-destructive/50 bg-destructive/5' :
                      alertLevel === 'high' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {claim.image_url && (
                        <div className="flex-shrink-0">
                          <img 
                            src={claim.image_url}
                            alt="" 
                            className="w-20 h-20 object-cover rounded-md bg-muted"
                            loading="lazy"
                            onError={(e) => {
                              // Hide image on error instead of retrying
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <Badge variant={claim.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                            {claim.platform}
                          </Badge>
                          {!!claim.verification_id && (
                            <Badge className="bg-emerald-500 text-white text-xs font-bold">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              VERIFIED
                            </Badge>
                          )}
                          {alertLevel === 'critical' && !claim.verification_id && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                          {alertLevel === 'high' && !claim.verification_id && (
                            <Badge className="bg-yellow-600 text-xs">High Alert</Badge>
                          )}
                          {!claim.verification_id && (
                            <Badge variant="outline" className="text-xs">{claim.status}</Badge>
                          )}
                        </div>

                        {/* Claim Text */}
                        <p className="font-medium mb-2 line-clamp-2 text-sm leading-snug">{claim.claim_text}</p>

                        {/* Compact Stats with Icons */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {claim.engagement_score >= 1000 
                              ? `${(claim.engagement_score / 1000).toFixed(1)}k` 
                              : claim.engagement_score.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {claim.engagement_velocity > 0 ? `${Math.round(claim.engagement_velocity)}/hr` : '—'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {hoursSinceFirstSeen}h
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {claim.verification_id && claim.share_token ? (
                            <>
                              <Button 
                                onClick={() => navigate(`/share/${claim.share_token}`)} 
                                size="sm" 
                                className="flex-1 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400"
                                variant="outline"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                View Verification
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVerificationId(claim.verification_id!);
                                  setShareModalOpen(true);
                                }}
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => handleVerifyNow(claim)} size="sm" className="flex-1">
                              Verify Now
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a href={claim.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {shareModalOpen && selectedVerificationId && (
        <ShareModal
          verificationId={selectedVerificationId}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedVerificationId(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
