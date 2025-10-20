import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, ExternalLink } from 'lucide-react'
import { useNFTImage } from '@/hooks/useNFTImage'
import badgeImage from '@/assets/truth-badge.png'

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
}

export function TruthBadgeGallery() {
  const { user } = useAuth()
  const [badges, setBadges] = useState<TruthBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchBadges()
  }, [user])

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from('nft_badges')
      .select('id, token_id, transaction_hash, claim_text, trust_score, minted_at, metadata_uri, rarity_tier, virality_score, minted_at_rank')
      .eq('user_id', user!.id)
      .order('minted_at', { ascending: false })

    if (!error) setBadges(data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center py-12">Loading badges...</div>
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Truth Badges</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
      </div>
    </div>
  )
}

function BadgeCard({ badge }: { badge: TruthBadge }) {
  const { imageUrl, loading } = useNFTImage(
    badge.metadata_uri, 
    badge.id,
    badge.claim_text,
    badge.trust_score,
    badge.rarity_tier || undefined
  )
  const displayImage = imageUrl || badgeImage

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
            {getRarityIcon(badge.rarity_tier)} {badge.rarity_tier}
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
          ) : (
            <div className="relative h-40 w-40 mx-auto nft-image-wrapper">
              {/* Glass backdrop */}
              <div className="absolute inset-0 bg-background/30 backdrop-blur-sm rounded-lg" />
              <img 
                src={displayImage} 
                alt="Truth Badge" 
                className="relative h-full w-full object-contain drop-shadow-2xl group-hover:scale-125 transition-transform duration-700 ease-out nft-badge-entrance"
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
        </div>
      </CardContent>
    </Card>
  )
}
