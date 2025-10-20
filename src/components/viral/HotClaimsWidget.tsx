import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, TrendingUp, Clock, Target, ArrowRight, CheckCircle2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ShareModal } from '@/components/share-modal';
import { ClaimImageFallback } from './ClaimImageFallback';

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
  verification_id: string | null;
  share_token: string | null;
  updated_at: string;
  image_url: string | null;
}

export function HotClaimsWidget() {
  const [hotClaims, setHotClaims] = useState<HotClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedClaimForShare, setSelectedClaimForShare] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHotClaims();

    // Real-time subscription for new hot claims and verification updates
    const channel = supabase
      .channel('hot-claims-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'viral_claims'
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

  // Auto-generate images disabled (using static fallbacks for zero-cost premium visuals)
  // useEffect(() => {
  //   if (hotClaims.length === 0) return;

  //   hotClaims.forEach((claim) => {
  //     if (!claim.image_url && !generatingImageIds.has(claim.id)) {
  //       generateClaimImage(claim);
  //     }
  //   });
  // }, [hotClaims]);

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

  const getRarityDisplayName = (rarity: string | null) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'MYTHIC';
      case 'EPIC':
        return 'SUPREME';
      case 'RARE':
        return 'ELITE';
      case 'UNCOMMON':
        return 'DISTINGUISHED';
      case 'COMMON':
        return 'VERIFIED';
      default:
        return 'VERIFIED';
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

  const handleVerifyNow = (claim: HotClaim) => {
    setVerifyingIds((prev) => new Set(prev).add(claim.id));
    navigate(`/verify?claim=${encodeURIComponent(claim.claim_text)}&viralClaimId=${claim.id}`);
  };

  const getClaimRarityForFallback = (claim: HotClaim): string => {
    // Use explicit rarity if available
    if (claim.rarity_tier) return claim.rarity_tier;
    
    // Otherwise infer from engagement score
    const score = claim.engagement_score;
    if (score >= 10000) return 'LEGENDARY';
    if (score >= 5000) return 'EPIC';
    if (score >= 2000) return 'RARE';
    if (score >= 1000) return 'UNCOMMON';
    return 'COMMON';
  };

  const generateClaimImage = async (claim: HotClaim) => {
    if (generatingImageIds.has(claim.id)) return;
    
    setGeneratingImageIds(prev => new Set(prev).add(claim.id));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-claim-image', {
        body: {
          claim_text: claim.claim_text,
          viral_claim_id: claim.id
        }
      });

      if (error) {
        console.error('Image generation error:', error);
        toast({
          title: "Image Generation Failed",
          description: "Could not generate visual. AI service may need configuration.",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        fetchHotClaims();
        toast({
          title: "Visual Generated",
          description: "Claim image created successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation Error",
        description: error.message || "Failed to generate image",
        variant: "destructive"
      });
    } finally {
      setGeneratingImageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(claim.id);
        return newSet;
      });
    }
  };

  const retryImageGeneration = (claim: HotClaim) => {
    generateClaimImage(claim);
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
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotClaims.map((claim, index) => {
            const hoursSinceDetection = claim.first_seen_at
              ? (Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60)
              : 0;
            
            const velocityPercentage = Math.min(100, (claim.engagement_velocity / 2000) * 100);
            const isVerified = !!claim.verification_id;

            return (
              <Card
                key={claim.id}
                className={cn(
                  "overflow-hidden transition-all duration-300 flex flex-col min-h-[500px]",
                  index === 0 && "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
                  isVerified && "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/20"
                )}
              >
                {/* Claim Image - Standardized Aspect Ratio */}
                {claim.image_url ? (
                  <div className="relative w-full aspect-[16/9] max-h-[300px] overflow-hidden">
                    <img 
                      src={claim.image_url}
                      alt={claim.claim_text}
                      className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Verified Badge Overlay */}
                    {isVerified && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse">
                        <CheckCircle2 size={16} />
                        ✓ VERIFIED
                      </div>
                    )}
                  
                  {/* Overlays */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {index === 0 && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm px-3 py-1 shadow-lg animate-pulse">
                        🔥 RACE TO VERIFY
                      </Badge>
                    )}
                    {claim.rarity_tier && (
                      <Badge
                        className={`bg-gradient-to-r ${getRarityColor(claim.rarity_tier)} text-white font-bold shadow-lg`}
                      >
                        {getRarityIcon(claim.rarity_tier)} {getRarityDisplayName(claim.rarity_tier)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Rank Badge - Only show if not verified */}
                  {!isVerified && (
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                    </div>
                  )}
                </div>
              ) : generatingImageIds.has(claim.id) ? (
                <div className="relative w-full aspect-[16/9] max-h-[300px] bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="text-sm text-muted-foreground font-medium">Generating visual...</p>
                  </div>
                </div>
              ) : (
                <ClaimImageFallback
                  claimText={claim.claim_text}
                  platform={claim.platform}
                  rarityTier={getClaimRarityForFallback(claim)}
                  engagementScore={claim.engagement_score}
                  rank={index + 1}
                  showRaceBadge={index === 0}
                />
              )}
              <CardContent className="flex-1 flex flex-col justify-between p-5 space-y-4">
                <div className="space-y-4">
                  {/* Verified Status Banner */}
                  {isVerified && (
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-500 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">VERIFIED CLAIM</span>
                    </div>
                  )}

                  {/* Platform Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {claim.platform}
                    </Badge>
                  </div>

                  {/* Claim Text */}
                  <p className="font-semibold text-base line-clamp-3">
                    {claim.claim_text}
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                    <span className="text-muted-foreground">Potential badge tier: </span>
                    <span className="font-bold">
                      {getRarityDisplayName(claim.rarity_tier)}
                    </span>
                    {hoursSinceDetection < 6 && claim.engagement_score >= 5000 && (
                      <span className="ml-2 text-orange-500 font-bold">
                        ⚡ MYTHIC POTENTIAL!
                      </span>
                    )}
                  </div>
                )}

                {/* Verify Button */}
                <div className="mt-auto">
                  {isVerified && claim.share_token ? (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => navigate(`/share/${claim.share_token}`)}
                        className="flex-1 min-h-[40px] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        View Verification
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClaimForShare(claim.verification_id);
                          setShareModalOpen(true);
                        }}
                        variant="outline"
                        className="shrink-0 min-h-[40px]"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleVerifyNow(claim)}
                      disabled={verifyingIds.has(claim.id)}
                      className={cn(
                        "w-full min-h-[40px] font-semibold",
                        index === 0 && "bg-orange-500 hover:bg-orange-600"
                      )}
                    >
                      {verifyingIds.has(claim.id) ? 'Verifying…' : (index === 0 ? '🏁 Verify Now!' : 'Verify')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </CardContent>

      {shareModalOpen && selectedClaimForShare && (
        <ShareModal
          verificationId={selectedClaimForShare}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedClaimForShare(null);
          }}
        />
      )}
    </Card>
  );
}
