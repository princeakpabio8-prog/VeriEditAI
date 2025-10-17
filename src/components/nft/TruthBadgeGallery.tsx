import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, ExternalLink, Calendar } from 'lucide-react'
import { TrustScoreDisplay } from '@/components/trust-score-display'

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {badges.map((badge) => (
        <Card key={badge.id} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20" />
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">#{badge.token_id}</Badge>
              <TrustScoreDisplay score={badge.trust_score} size="sm" />
            </div>
            <CardTitle className="text-lg mt-2">Truth Badge</CardTitle>
          </CardHeader>
          
          <CardContent className="relative space-y-3">
            <div className="text-sm text-muted-foreground line-clamp-3">
              {badge.claim_text}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(badge.minted_at).toLocaleDateString()}
            </div>
            
            <a
              href={`https://explorer-liberty10.shardeum.org/tx/${badge.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
