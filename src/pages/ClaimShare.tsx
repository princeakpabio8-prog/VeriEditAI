import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, ExternalLink, Target, TrendingUp } from 'lucide-react';
import { DynamicMeta } from '@/components/DynamicMeta';
import { formatDistanceToNow } from 'date-fns';

interface ViralClaim {
  id: string;
  claim_text: string;
  platform: string;
  source_url?: string | null;
  engagement_score: number;
  engagement_velocity: number;
  first_seen_at: string;
  status: string;
  rarity_tier?: string | null;
  image_url?: string | null;
  og_image_url?: string | null;
  metadata?: any;
}

export default function ClaimShare() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<ViralClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      fetchClaim();
    }
  }, [shareToken]);

  const fetchClaim = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_claims')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Claim not found');
        return;
      }

      setClaim(data);
    } catch (err: any) {
      console.error('Error fetching claim:', err);
      setError(err.message || 'Failed to load claim');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Claim Not Found</CardTitle>
            <CardDescription>{error || 'This claim does not exist or has been removed.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Construct full image URL for social sharing
  const getFullImageUrl = () => {
    const imageUrl = claim.og_image_url || claim.image_url;
    if (!imageUrl) return undefined;
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // Otherwise, construct full URL
    return `${window.location.origin}${imageUrl}`;
  };

  return (
    <>
      <DynamicMeta
        title={`🔥 Viral Claim: ${claim.claim_text.substring(0, 60)}...`}
        description={`Trending on ${claim.platform} with ${claim.engagement_score.toLocaleString()} engagement. Race to verify first and earn NFT badges!`}
        image={getFullImageUrl()}
        url={window.location.href}
        type="article"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
              <h1 className="text-2xl font-bold">Viral Claim</h1>
            </div>
            <Button onClick={() => navigate('/verify?viralClaimId=' + claim.id)}>
              <Target className="h-4 w-4 mr-2" />
              Verify This Claim
            </Button>
          </div>

          {/* Main Claim Card */}
          <Card>
            {claim.image_url && (
              <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
                <img 
                  src={claim.image_url}
                  alt={claim.claim_text}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between gap-2 mb-4">
                <Badge variant="outline">{claim.platform}</Badge>
                {claim.rarity_tier && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    {claim.rarity_tier}
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-xl">{claim.claim_text}</CardTitle>
              
              <CardDescription>
                Detected {formatDistanceToNow(new Date(claim.first_seen_at), { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Engagement</div>
                  <div className="text-2xl font-bold">{claim.engagement_score.toLocaleString()}</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Velocity</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    {claim.engagement_velocity.toLocaleString()}/hr
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="text-2xl font-bold capitalize">{claim.status}</div>
                </div>
              </div>

              {/* Source Link */}
              {(claim.source_url || claim.metadata?.source_url) && (
                <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">View Original Source</div>
                    <div className="text-xs text-muted-foreground">Watch or read the full content on {claim.platform}</div>
                  </div>
                  <Button
                    onClick={() => window.open(claim.source_url || claim.metadata?.source_url, '_blank')}
                    variant="outline"
                  >
                    Open
                  </Button>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6 text-center space-y-3">
                <h3 className="text-lg font-bold">Be the First to Verify!</h3>
                <p className="text-sm text-muted-foreground">
                  Verify this trending claim and earn rare NFT badges. Higher engagement = rarer rewards!
                </p>
                <Button 
                  size="lg"
                  onClick={() => navigate('/verify?claim=' + encodeURIComponent(claim.claim_text) + '&viralClaimId=' + claim.id)}
                  className="w-full md:w-auto"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start Verification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">VeriedIT AI</span> - AI-Powered Truth Verification
          </div>
        </div>
      </div>
    </>
  );
}
