import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ViralClaim {
  id: string;
  claim_text: string;
  platform: string;
  source_url: string;
  engagement_score: number;
  status: string;
  metadata: any;
  created_at: string;
}

export default function SignalFeed({ embedded = false }: { embedded?: boolean }) {
  const [verifiedClaims, setVerifiedClaims] = useState<ViralClaim[]>([]);
  const [debunkedClaims, setDebunkedClaims] = useState<ViralClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();

    // Realtime updates
    const channel = supabase
      .channel('signal-feed-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'viral_claims',
        filter: 'status=in.(verified,debunked)'
      }, () => {
        fetchSignals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSignals() {
    try {
      // Fetch verified claims
      const { data: verified } = await supabase
        .from('viral_claims')
        .select('*')
        .eq('status', 'verified')
        .order('engagement_score', { ascending: false })
        .limit(10);

      // Fetch debunked claims
      const { data: debunked } = await supabase
        .from('viral_claims')
        .select('*')
        .eq('status', 'debunked')
        .order('engagement_score', { ascending: false })
        .limit(10);

      setVerifiedClaims(verified || []);
      setDebunkedClaims(debunked || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && <Navigation />}
      <div className={embedded ? "py-8" : "pt-24 pb-24 md:pb-16 px-4"}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Signal Feed</h1>
            <p className="text-muted-foreground">High-engagement claims that have been verified or debunked</p>
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading signals...</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Verified Claims */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-green-600">✓</span> Verified Stories
                </h2>
                <div className="space-y-4">
                  {verifiedClaims.length === 0 ? (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">No verified claims yet</p>
                    </Card>
                  ) : (
                    verifiedClaims.map((claim) => (
                      <Card key={claim.id} className="p-4 border-green-500/30 bg-green-500/5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-600">Verified</Badge>
                              <Badge variant="outline">{claim.platform}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                {claim.engagement_score.toLocaleString()}
                              </div>
                            </div>
                            <p className="font-medium mb-2">{claim.claim_text}</p>
                            {claim.metadata?.subreddit && (
                              <p className="text-sm text-muted-foreground">
                                r/{claim.metadata.subreddit}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={claim.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Debunked Claims */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-red-600">✗</span> Debunked Claims
                </h2>
                <div className="space-y-4">
                  {debunkedClaims.length === 0 ? (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">No debunked claims yet</p>
                    </Card>
                  ) : (
                    debunkedClaims.map((claim) => (
                      <Card key={claim.id} className="p-4 border-red-500/30 bg-red-500/5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-600">Debunked</Badge>
                              <Badge variant="outline">{claim.platform}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                {claim.engagement_score.toLocaleString()}
                              </div>
                            </div>
                            <p className="font-medium mb-2">{claim.claim_text}</p>
                            {claim.metadata?.subreddit && (
                              <p className="text-sm text-muted-foreground">
                                r/{claim.metadata.subreddit}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={claim.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {!embedded && <Footer />}
    </div>
  );
}
