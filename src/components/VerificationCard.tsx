import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MintBadgeButton } from './nft/MintBadgeButton';
import { ExternalLink, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationCardProps {
  verification: {
    id: string;
    content: string;
    trust_score: number;
    status?: string;
    created_at: string;
    source_url?: string;
    category?: string;
  };
  showMintBadge?: boolean;
  className?: string;
}

export function VerificationCard({ verification, showMintBadge = true, className = '' }: VerificationCardProps) {
  const { user } = useAuth();
  const canMintBadge = showMintBadge && verification.trust_score >= 75 && user;

  const getStatusColor = (score: number) => {
    if (score >= 75) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(verification.trust_score)}>
              {verification.trust_score}% Trust Score
            </Badge>
            {verification.category && (
              <Badge variant="outline" className="capitalize">
                {verification.category}
              </Badge>
            )}
            {canMintBadge && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                NFT Eligible
              </Badge>
            )}
          </div>
          {verification.source_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={verification.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm line-clamp-3">{verification.content}</p>

        {/* Footer with date and mint button */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {new Date(verification.created_at).toLocaleDateString()}
          </span>
          {canMintBadge && (
            <MintBadgeButton 
              verificationId={verification.id} 
              trustScore={verification.trust_score}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
