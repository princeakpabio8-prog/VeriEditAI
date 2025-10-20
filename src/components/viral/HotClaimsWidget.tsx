import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, TrendingUp, Clock, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface HotClaim {
  id: string;
  claim_text: string;
  engagement_score: number;
  engagement_velocity: number;
  first_seen_at: string;
  platform: string;
  status: string;
  rarity_tier: string | null;
  virality_score: number;
  metadata: any;
}

export function HotClaimsWidget() {
  const [hotClaims, setHotClaims] = useState<HotClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHotClaims();

    // Real-time subscription for new hot claims
    const channel = supabase
      .channel('hot-claims-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'viral_claims',
          filter: 'engagement_score=gte.1000'
        },
        () => {
          fetchHotClaims();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHotClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_claims')
        .select('*')
        .in('status', ['detected', 'trending', 'monitoring'])
        .order('virality_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHotClaims(data || []);
    } catch (error) {
      console.error('Error fetching hot claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string | null) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'from-yellow-400 to-orange-500';
      case 'EPIC':
        return 'from-purple-400 to-pink-500';
      case 'RARE':
        return 'from-blue-400 to-cyan-500';
      case 'UNCOMMON':
        return 'from-green-400 to-emerald-500';
      default:
        return 'from-gray-400 to-slate-500';
    }
  };

  const getRarityIcon = (rarity: string | null) => {
    switch (rarity) {
      case 'LEGENDARY':
        return '⚡';
      case 'EPIC':
        return '💎';
      case 'RARE':
        return '🔥';
      case 'UNCOMMON':
        return '✨';
      default:
        return '📝';
    }
  };

  const handleVerifyNow = (claimText: string) => {
    navigate(`/verify?claim=${encodeURIComponent(claimText)}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Hot Claims - Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hotClaims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Hot Claims
          </CardTitle>
          <CardDescription>
            No viral claims detected right now. Check back soon!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            <CardTitle>🔥 Hot Claims - Race to Verify First!</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/viral-claims')}
            className="gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Verify trending claims before others to mint rare NFT badges
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hotClaims.map((claim, index) => {
          const hoursSinceDetection = claim.first_seen_at
            ? (Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60)
            : 0;
          
          const velocityPercentage = Math.min(100, (claim.engagement_velocity / 2000) * 100);

          return (
            <div
              key={claim.id}
              className={`p-4 rounded-lg border-2 ${
                index === 0 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Rank and Rarity Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    {claim.rarity_tier && (
                      <Badge
                        className={`bg-gradient-to-r ${getRarityColor(claim.rarity_tier)} text-white font-bold`}
                      >
                        {getRarityIcon(claim.rarity_tier)} {claim.rarity_tier}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {claim.platform}
                    </Badge>
                  </div>

                  {/* Claim Text */}
                  <p className="font-medium line-clamp-2">
                    {claim.claim_text}
                  </p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{claim.engagement_score.toLocaleString()} engagement</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{Math.round(claim.engagement_velocity)}/hr velocity</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {claim.first_seen_at
                          ? formatDistanceToNow(new Date(claim.first_seen_at), { addSuffix: true })
                          : 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Velocity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Virality Velocity</span>
                      <span>{Math.round(claim.engagement_velocity)}/hr</span>
                    </div>
                    <Progress value={velocityPercentage} className="h-2" />
                  </div>

                  {/* Potential Rarity */}
                  {claim.rarity_tier && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Potential badge rarity: </span>
                      <span className="font-bold">
                        {claim.rarity_tier}
                      </span>
                      {hoursSinceDetection < 6 && claim.engagement_score >= 5000 && (
                        <span className="ml-2 text-orange-500 font-bold">
                          ⚡ LEGENDARY POTENTIAL!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Verify Button */}
                <Button
                  onClick={() => handleVerifyNow(claim.claim_text)}
                  size="sm"
                  className={index === 0 ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {index === 0 ? '🏁 Verify Now!' : 'Verify'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
