import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
}

export default function ViralClaims() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claims, setClaims] = useState<ViralClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'monitoring'>('all');

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
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching viral claims:', error);
      toast({
        title: 'Error',
        description: 'Failed to load viral claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            <h1 className="text-4xl font-bold mb-2">Viral Claims Monitor</h1>
            <p className="text-muted-foreground">Track and verify claims spreading across social media</p>
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

          {/* Filters */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Claims</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="high">High Alert</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Claims List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading viral claims...</p>
              </Card>
            ) : claims.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No viral claims found</p>
              </Card>
            ) : (
              claims.map((claim) => {
                const alertLevel = getAlertLevel(claim);
                const hoursSinceFirstSeen = ((Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60)).toFixed(1);
                
                return (
                  <Card 
                    key={claim.id} 
                    className={`p-6 ${
                      alertLevel === 'critical' ? 'border-destructive/50 bg-destructive/5' :
                      alertLevel === 'high' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={claim.status === 'verified' ? 'default' : 'secondary'}>
                            {claim.platform}
                          </Badge>
                          {alertLevel === 'critical' && (
                            <Badge variant="destructive">Critical</Badge>
                          )}
                          {alertLevel === 'high' && (
                            <Badge className="bg-yellow-600">High Alert</Badge>
                          )}
                          <Badge variant="outline">{claim.status}</Badge>
                        </div>
                        <p className="text-lg font-medium mb-3">{claim.claim_text}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Engagement:</span>{' '}
                            {claim.engagement_score.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Velocity:</span>{' '}
                            {claim.engagement_velocity > 0 ? `↑${Math.round(claim.engagement_velocity)}/hr` : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Age:</span>{' '}
                            {hoursSinceFirstSeen}h
                          </div>
                          {claim.metadata?.subreddit && (
                            <div>
                              <span className="font-medium">Subreddit:</span>{' '}
                              r/{claim.metadata.subreddit}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => handleVerifyNow(claim)}>
                          Verify Now
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={claim.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Source
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
