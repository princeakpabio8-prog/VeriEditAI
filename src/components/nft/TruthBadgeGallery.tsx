import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, ExternalLink, RefreshCw } from 'lucide-react'
import { useNFTImage } from '@/hooks/useNFTImage'
import { NFTBadgeFallback } from '@/components/nft/NFTBadgeFallback'
import badgeImage from '@/assets/truth-badge.png'
import { toast } from 'sonner'
import { MobileLoadingSkeleton } from '@/components/MobileLoadingSkeleton'
import { PullToRefresh } from '@/components/PullToRefresh'
import { useIsMobile } from '@/hooks/use-mobile'

interface TruthBadge {
  id: string
  token_id: string
  transaction_hash: string
  claim_text: string
  trust_score: number
  minted_at: string
  metadata_uri: string
  rarity_tier: string | null
  virality_score: number | null
  minted_at_rank: number | null
  opensea_image_confirmed: boolean | null
  opensea_refresh_count: number | null
  opensea_last_refresh: string | null
}

export function TruthBadgeGallery() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [badges, setBadges] = useState<TruthBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingAll, setSyncingAll] = useState(false)
  const [page, setPage] = useState(1)
  const BADGES_PER_PAGE = 12

  // Fetch badges on mount and when user changes
  useEffect(() => {
    if (user) fetchBadges()
  }, [user])

  // Realtime subscription to auto-update when new badges are minted
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('nft-badges-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nft_badges',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('New badge minted, refreshing list...');
          fetchBadges();
          toast.success('🎉 New badge detected!', {
            description: 'Your minted badge is now in your collection'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'nft_badges',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Badge updated, refreshing list...');
          fetchBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user])

  // Refetch badges when page becomes visible (e.g., returning from another tab or app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page visible, refreshing badges...');
        fetchBadges();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user])

  // Listen for manual mint events from MintBadgeButton
  useEffect(() => {
    const handleMintEvent = (event: CustomEvent) => {
      console.log('Badge minted event received:', event.detail);
      fetchBadges();
      toast.success('🎉 New badge added!', {
        description: 'Your freshly minted badge is now in your collection'
      });
    };

    window.addEventListener('nft-badge-minted', handleMintEvent as EventListener);
    return () => window.removeEventListener('nft-badge-minted', handleMintEvent as EventListener);
  }, [user])

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from('nft_badges')
      .select('id, token_id, transaction_hash, claim_text, trust_score, minted_at, metadata_uri, rarity_tier, virality_score, minted_at_rank, opensea_image_confirmed, opensea_refresh_count, opensea_last_refresh')
      .eq('user_id', user!.id)
      .order('minted_at', { ascending: false })
      .limit(BADGES_PER_PAGE * page)

    if (!error) setBadges(data || [])
    setLoading(false)
  }

  const handleRefresh = async () => {
    await fetchBadges()
  }

  const handleSyncAllBadges = async () => {
    try {
      setSyncingAll(true);
      
      const { data, error } = await supabase.functions.invoke('backfill-opensea-sync');
      
      if (error) throw error;
      
      toast.success(`Synced ${data.synced}/${data.total} badges to OpenSea!`, {
        description: 'Images will appear on OpenSea within 5-10 minutes.'
      });
      
      // Refresh badge list
      fetchBadges();
    } catch (err: any) {
      toast.error('Failed to sync badges', {
        description: err.message
      });
    } finally {
      setSyncingAll(false);
    }
  };

  if (loading) {
    return <MobileLoadingSkeleton variant="grid" count={6} />
  }

  if (badges.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            You haven't minted any Truth Badges yet.
            <br />
            Verify claims with ≥75% trust score to earn badges!
          </p>
        </CardContent>
      </Card>
    )
  }

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

  const hasUnsyncedBadges = badges.some(b => !b.opensea_image_confirmed || !b.opensea_last_refresh);
  const displayedBadges = badges.slice(0, BADGES_PER_PAGE * page);
  const hasMore = badges.length === BADGES_PER_PAGE * page;

  const galleryContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Truth Badges</h2>
        
        {hasUnsyncedBadges && (
          <Button
            onClick={handleSyncAllBadges}
            disabled={syncingAll}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Syncing All...' : 'Sync All to OpenSea'}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedBadges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
      </div>
      
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={() => {
              setPage(p => p + 1);
              fetchBadges();
            }}
            variant="outline"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )

  // Wrap with pull-to-refresh on mobile
  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        {galleryContent}
      </PullToRefresh>
    )
  }

  return galleryContent
}

function BadgeCard({ badge }: { badge: TruthBadge }) {
  const { imageUrl, loading, error } = useNFTImage(
    badge.metadata_uri, 
    badge.id,
    badge.claim_text,
    badge.trust_score,
    badge.rarity_tier || undefined
  )
  const [imageFailed, setImageFailed] = useState(false)
  const displayImage = imageUrl || badgeImage
  const shouldShowFallback = !imageUrl || imageFailed || error
  
  // Sync status indicators
  const isSyncing = badge.opensea_image_confirmed === false
  const needsRefresh = !badge.opensea_last_refresh

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

  const getRarityGlow = (rarity: string | null) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'shadow-[0_0_60px_rgba(251,191,36,0.7),0_0_30px_rgba(251,191,36,0.5)] nft-legendary-particles';
      case 'EPIC':
        return 'shadow-[0_0_60px_rgba(168,85,247,0.7),0_0_30px_rgba(168,85,247,0.5)] nft-epic-particles';
      case 'RARE':
        return 'shadow-[0_0_60px_rgba(59,130,246,0.7),0_0_30px_rgba(59,130,246,0.5)]';
      case 'UNCOMMON':
        return 'shadow-[0_0_60px_rgba(34,197,94,0.7),0_0_30px_rgba(34,197,94,0.5)]';
      default:
        return 'shadow-[0_0_30px_rgba(100,116,139,0.4)]';
    }
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-2xl hover:scale-[1.05] hover:border-primary/70 transition-all duration-500 relative nft-card-cinematic"
    >
      {/* Rarity Badge Overlay */}
      {badge.rarity_tier && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className={`bg-gradient-to-r ${getRarityColor(badge.rarity_tier)} text-white font-bold shadow-lg`}>
            {getRarityIcon(badge.rarity_tier)} {getRarityDisplayName(badge.rarity_tier)}
          </Badge>
        </div>
      )}
      
      {/* First Verifier Badge */}
      {badge.minted_at_rank === 1 && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg">
            🥇 FIRST
          </Badge>
        </div>
      )}
      
      <CardContent className="p-6 space-y-4">
        <div className="relative nft-image-container">
          {/* Enhanced multi-layer glow */}
          <div className={`absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-600/30 rounded-lg blur-2xl group-hover:blur-3xl transition-all duration-500 ${getRarityGlow(badge.rarity_tier)}`} />
          
          {/* Holographic shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          {/* Rotating ring for high rarity */}
          {(badge.rarity_tier === 'LEGENDARY' || badge.rarity_tier === 'EPIC') && (
            <div className="absolute inset-0 nft-rotating-ring opacity-60" />
          )}
          
          {loading ? (
            <div className="relative h-40 w-40 mx-auto bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse rounded-lg shimmer" />
          ) : shouldShowFallback ? (
            <div className="relative h-40 w-40 mx-auto nft-image-wrapper">
              <NFTBadgeFallback 
                rarity={badge.rarity_tier}
                trustScore={badge.trust_score}
                claimText={badge.claim_text}
                tokenId={badge.token_id}
              />
            </div>
          ) : (
            <div className="relative h-40 w-40 mx-auto nft-image-wrapper">
              {/* Glass backdrop */}
              <div className="absolute inset-0 bg-background/30 backdrop-blur-sm rounded-lg" />
              <img 
                src={displayImage} 
                alt="Truth Badge"
                loading="lazy"
                decoding="async"
                className="relative h-full w-full object-contain drop-shadow-2xl group-hover:scale-125 transition-transform duration-700 ease-out nft-badge-entrance"
                onError={(e) => {
                  console.error(`❌ Badge image failed to load: ${displayImage}`)
                  setImageFailed(true)
                }}
                onLoad={() => {
                  console.log(`✅ Badge image loaded: ${displayImage}`)
                }}
              />
            </div>
          )}
        </div>

              <div className="space-y-2 text-center">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token ID</span>
                  <span className="font-mono font-semibold">#{badge.token_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trust Score</span>
                  <span className="font-bold text-primary">{badge.trust_score}%</span>
                </div>
                
                {/* Virality Score */}
                {badge.virality_score !== null && badge.virality_score > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Virality</span>
                    <span className="font-bold text-orange-500">{Math.round(badge.virality_score)}</span>
                  </div>
                )}
                
                {/* Verifier Rank */}
                {badge.minted_at_rank && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rank</span>
                    <span className="font-bold">
                      {badge.minted_at_rank === 1 ? '🥇 1st' : badge.minted_at_rank === 2 ? '🥈 2nd' : badge.minted_at_rank === 3 ? '🥉 3rd' : `#${badge.minted_at_rank}`}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 text-center">
                {badge.claim_text}
              </p>

              <div className="text-xs text-muted-foreground text-center">
                Minted {new Date(badge.minted_at).toLocaleDateString()}
              </div>
              
              {/* OpenSea Sync Status */}
              <div className="flex items-center justify-center gap-1 text-xs pt-2 border-t">
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                    <span className="text-blue-500">🔄 Syncing to OpenSea...</span>
                  </>
                ) : badge.opensea_image_confirmed ? (
                  <button
                    onClick={() => window.open(`https://opensea.io/assets/matic/0x66911176b4eC70086C50b3155b04dEe433652673/${badge.token_id}`, '_blank')}
                    className="text-green-500 hover:text-green-600 hover:underline transition-colors cursor-pointer"
                  >
                    ✅ Live on OpenSea
                  </button>
                ) : needsRefresh ? (
                  <>
                    <span className="text-yellow-500">⏳ Pending sync</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">Synced</span>
                  </>
                )}
              </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(`https://polygonscan.com/tx/${badge.transaction_hash}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            PolygonScan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(badge.metadata_uri, '_blank')}
          >
            Metadata
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(`https://opensea.io/assets/matic/0x66911176b4eC70086C50b3155b04dEe433652673/${badge.token_id}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            OpenSea
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
