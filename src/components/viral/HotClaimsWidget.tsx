import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, TrendingUp, Clock, Target, ArrowRight, CheckCircle2, Share2, Info, Sparkles, Award, ExternalLink, Search, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ClaimShareModal } from './ClaimShareModal';
import { ClaimImageFallback } from './ClaimImageFallback';
import { MintBadgeButton } from '@/components/nft/MintBadgeButton';
import { NFTMintPromptModal } from '@/components/nft/NFTMintPromptModal';
import { ClaimDetailsModal } from './ClaimDetailsModal';

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
  source_url: string | null;
}

export function HotClaimsWidget() {
  const [hotClaims, setHotClaims] = useState<HotClaim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<HotClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedClaimForShare, setSelectedClaimForShare] = useState<{ id: string; text: string } | null>(null);
  const [userVerifiedClaims, setUserVerifiedClaims] = useState<Set<string>>(new Set());
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(false);
  const [nftMintPrompt, setNftMintPrompt] = useState<{
    show: boolean;
    verificationId: string;
    trustScore: number;
    claimText: string;
  } | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedClaimForDetails, setSelectedClaimForDetails] = useState<HotClaim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [justVerifiedClaims, setJustVerifiedClaims] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Load user's verified claims from localStorage
  useEffect(() => {
    const storedVerifications = localStorage.getItem('user_verified_claims');
    if (storedVerifications) {
      const verifiedData = JSON.parse(storedVerifications);
      // Handle both old array format and new object format
      const claimIds = Array.isArray(verifiedData) 
        ? verifiedData 
        : Object.keys(verifiedData);
      setUserVerifiedClaims(new Set(claimIds));
    }
    
    const hasSeenHelp = localStorage.getItem('has_seen_hot_claims_help');
    if (!hasSeenHelp) {
      setShowFirstTimeHelp(true);
    }
  }, []);

  // Check for NFT minting prompt from navigation state (only show once per claim)
  useEffect(() => {
    if (location.state?.showNFTPrompt && location.state?.scrollToVerified) {
      const viralClaimId = location.state.scrollToVerified;
      const verificationData = getUserVerificationData(viralClaimId);
      
      // Check if we've already shown the prompt for this claim
      const shownPrompts = sessionStorage.getItem('shown_nft_prompts') || '';
      if (shownPrompts.includes(viralClaimId)) {
        console.log('NFT prompt already shown for this claim, skipping');
        window.history.replaceState({}, document.title);
        return;
      }
      
      if (verificationData && verificationData.trustScore >= 75) {
        // Find the claim to get its text
        const claim = hotClaims.find(c => c.id === viralClaimId);
        
        setNftMintPrompt({
          show: true,
          verificationId: verificationData.verificationId,
          trustScore: verificationData.trustScore,
          claimText: claim?.claim_text || 'Your verified claim'
        });
        
        // Mark this prompt as shown
        sessionStorage.setItem('shown_nft_prompts', shownPrompts + ',' + viralClaimId);
      }
      
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, hotClaims]);

  // Get user's verification data for a claim
  const getUserVerificationData = (claimId: string) => {
    const storedVerifications = localStorage.getItem('user_verified_claims');
    if (!storedVerifications) return null;
    
    const verifiedData = JSON.parse(storedVerifications);
    return verifiedData[claimId] || null;
  };

  useEffect(() => {
    fetchHotClaims();

    // Real-time subscription for new hot claims and verification updates
    const channel = supabase
      .channel('hot-claims-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'viral_claims',
          filter: 'verification_id=not.is.null'
        },
        (payload) => {
          const verifiedClaim = payload.new as HotClaim;
          
          // Show toast notification
          toast({
            title: "🎉 Claim Just Verified!",
            description: `"${verifiedClaim.claim_text.substring(0, 60)}..." was verified by another user`,
          });
          
          // Mark as "just verified" for animation
          setJustVerifiedClaims(prev => new Set(prev).add(verifiedClaim.id));
          
          // Remove "just verified" badge after 30 seconds
          setTimeout(() => {
            setJustVerifiedClaims(prev => {
              const newSet = new Set(prev);
              newSet.delete(verifiedClaim.id);
              return newSet;
            });
          }, 30000);
          
          // Refresh claims list
          fetchHotClaims();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'viral_claims'
        },
        () => {
          // New hot claim detected
          fetchHotClaims();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds to ensure fresh claims
    const refreshInterval = setInterval(() => {
      fetchHotClaims();
    }, 30000); // 30 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
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

  // Filter claims based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClaims(hotClaims);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = hotClaims.filter(claim => 
      claim.claim_text.toLowerCase().includes(query) ||
      claim.platform.toLowerCase().includes(query)
    );
    setFilteredClaims(filtered);
  }, [searchQuery, hotClaims]);

  const fetchHotClaims = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const { data, error } = await supabase
        .from('viral_claims')
        .select('*')
        .in('status', ['detected', 'trending', 'monitoring'])
        .order('engagement_velocity', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching hot claims:', error);
        throw error;
      }
      
      console.log('Fetched viral claims:', data?.length || 0, 'claims');
      
      // Show ALL active claims regardless of engagement (data is already filtered server-side)
      setHotClaims(data || []);
      setLastFetchTime(new Date());
      
      if (showRefreshToast && data) {
        toast({
          title: "✅ Feed Refreshed",
          description: `Found ${data.length} hot claims`,
        });
      }
    } catch (error) {
      console.error('Error fetching hot claims:', error);
      if (showRefreshToast) {
        toast({
          title: "Refresh Failed",
          description: "Could not refresh feed. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleManualRefresh = () => {
    fetchHotClaims(true);
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
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Sign Up Required",
        description: "Please sign up or log in to verify claims and mint NFT badges",
      });
      navigate('/auth');
      return;
    }
    
    setVerifyingIds((prev) => new Set(prev).add(claim.id));
    // Store context for post-verification navigation
    sessionStorage.setItem('verification_source', 'hot_claims');
    sessionStorage.setItem('verifying_claim_id', claim.id);
    navigate(`/verify?claim=${encodeURIComponent(claim.claim_text)}&viralClaimId=${claim.id}`);
  };

  const dismissFirstTimeHelp = () => {
    setShowFirstTimeHelp(false);
    localStorage.setItem('has_seen_hot_claims_help', 'true');
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
          <div className="flex items-center gap-2 flex-1">
            <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            <CardTitle>🔥 Hot Claims - Race to Verify First!</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Be the first to verify trending claims and mint rare NFT badges! Higher engagement = rarer badges.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/viral-claims')}
            className="gap-1 shrink-0"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4 mt-2">
          <CardDescription className="flex items-center gap-2">
            Verify trending claims before others to mint rare NFT badges
            <Badge variant="outline" className="ml-2 gap-1">
              <Clock className="h-3 w-3" />
              Updated {formatDistanceToNow(lastFetchTime, { addSuffix: true })}
            </Badge>
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search claims by keyword or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showFirstTimeHelp && (
          <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">First time here? Here's how it works!</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  🎯 Verify trending claims before anyone else<br/>
                  💎 Earn rarer badges for higher-engagement claims<br/>
                  🏆 Compete on the leaderboard and build your reputation
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={dismissFirstTimeHelp} className="h-6 text-xs shrink-0">
                Got it
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClaims.map((claim, index) => {
            const hoursSinceDetection = claim.first_seen_at
              ? (Date.now() - new Date(claim.first_seen_at).getTime()) / (1000 * 60 * 60)
              : 0;
            
            const velocityPercentage = Math.min(100, (claim.engagement_velocity / 2000) * 100);
            const isVerified = !!claim.verification_id;
            const userVerificationData = getUserVerificationData(claim.id);
            const verifiedByUser = userVerifiedClaims.has(claim.id);

            return (
              <Card
                key={claim.id}
                className={cn(
                  "overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col min-h-[500px] relative",
                  index === 0 && "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
                  isVerified && "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/20",
                  userVerifiedClaims.has(claim.id) && "ring-2 ring-primary/50"
                )}
              >
                {verifiedByUser && userVerificationData && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-4 py-1.5 shadow-2xl font-bold border-2 border-white dark:border-emerald-950">
                      ✓ Verified {userVerificationData.trustScore >= 75 ? '💎' : '✅'}
                    </Badge>
                  </div>
                )}
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
                    {justVerifiedClaims.has(claim.id) ? (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-400 to-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-bounce">
                        <Sparkles size={16} />
                        🎉 JUST VERIFIED!
                      </div>
                    ) : isVerified ? (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse">
                        <CheckCircle2 size={16} />
                        ✓ VERIFIED
                      </div>
                    ) : verifyingIds.has(claim.id) ? (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        VERIFYING...
                      </div>
                    ) : null}
                  
                  {/* Overlays */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className="flex gap-2">
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
                    {/* Trending Now Badge - Shows on top 3 claims by velocity */}
                    {index < 3 && claim.engagement_velocity > 100 && !isVerified && (
                      <Badge className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold text-xs px-3 py-1.5 shadow-lg animate-pulse flex items-center gap-1.5 w-fit">
                        <TrendingUp className="h-3 w-3" />
                        TRENDING NOW
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
                  {/* Verified Status Banner - Different message for user's own verification */}
                  {verifiedByUser && userVerificationData ? (
                    <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">✓ YOU VERIFIED THIS!</span>
                      </div>
                      <p className="text-xs text-center text-emerald-600 dark:text-emerald-400">
                        Score: {userVerificationData.trustScore}% {userVerificationData.trustScore >= 75 ? '• NFT Eligible 💎' : ''}
                      </p>
                    </div>
                  ) : isVerified ? (
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-500 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">VERIFIED BY COMMUNITY</span>
                    </div>
                  ) : null}

                  {/* Platform Badge with External Link */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      {claim.platform}
                    </Badge>
                    
                    {(claim.source_url || claim.metadata?.source_url) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = claim.source_url || claim.metadata?.source_url;
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="h-7 w-7 p-0 hover:bg-primary/10"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">View original source ({claim.platform})</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {/* Claim Text */}
                  <p className="font-semibold text-base line-clamp-3 mb-2">
                    {claim.claim_text}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClaimForDetails(claim);
                      setDetailsModalOpen(true);
                    }}
                    className="p-0 h-auto text-xs text-primary hover:underline"
                  >
                    Read full details →
                  </Button>
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

                {/* Action Buttons */}
                <div className="mt-auto space-y-3">
                  {verifiedByUser && userVerificationData ? (
                    <>
                      {/* NFT Minting Section for User's Verification */}
                      <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                            You Verified This Claim!
                          </span>
                        </div>
                        {userVerificationData.trustScore >= 75 ? (
                          <Button
                            onClick={() => {
                              setNftMintPrompt({
                                show: true,
                                verificationId: userVerificationData.verificationId,
                                trustScore: userVerificationData.trustScore,
                                claimText: claim.claim_text
                              });
                            }}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            <Award className="h-4 w-4 mr-2" />
                            🎉 Mint Your NFT Badge ({userVerificationData.trustScore}%)
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Trust score: {userVerificationData.trustScore}%. Need 75%+ for NFT minting.
                          </p>
                        )}
                      </div>
                      
                      {/* View Verification Button */}
                      {claim.share_token && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => navigate(`/share/${claim.share_token}`)}
                            variant="outline"
                            className="flex-1 min-h-[40px]"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            View Full Report
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClaimForShare({ id: claim.id, text: claim.claim_text });
                              setShareModalOpen(true);
                            }}
                            variant="outline"
                            className="shrink-0 min-h-[40px]"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : isVerified && claim.share_token ? (
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
                          setSelectedClaimForShare({ id: claim.id, text: claim.claim_text });
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
                        "w-full min-h-[48px] md:min-h-[56px] font-semibold touch-manipulation",
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
        <ClaimShareModal
          viralClaimId={selectedClaimForShare.id}
          claimText={selectedClaimForShare.text}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedClaimForShare(null);
          }}
        />
      )}

      {detailsModalOpen && selectedClaimForDetails && (
        <ClaimDetailsModal
          claim={selectedClaimForDetails}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedClaimForDetails(null);
          }}
          onVerify={() => {
            setDetailsModalOpen(false);
            handleVerifyNow(selectedClaimForDetails);
          }}
        />
      )}

      {nftMintPrompt && (
        <NFTMintPromptModal
          isOpen={nftMintPrompt.show}
          onClose={() => setNftMintPrompt(null)}
          verificationId={nftMintPrompt.verificationId}
          trustScore={nftMintPrompt.trustScore}
          claimText={nftMintPrompt.claimText}
        />
      )}
    </Card>
  );
}
