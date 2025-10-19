import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, ExternalLink } from 'lucide-react'
import badgeImage from '@/assets/truth-badge.png'

interface TruthBadge {
  id: string
  token_id: string
  transaction_hash: string
  claim_text: string
  trust_score: number
  minted_at: string
  metadata_uri: string
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
      .select('*')
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Truth Badges</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <Card 
            key={badge.id} 
            className="group overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300"
          >
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
                <img 
                  src={badgeImage} 
                  alt="Truth Badge" 
                  className="relative h-40 w-40 mx-auto object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                />
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
                  View Metadata
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
