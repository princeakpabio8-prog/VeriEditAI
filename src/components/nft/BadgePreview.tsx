import { Award, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BadgePreviewProps {
  trustScore: number;
  claimText?: string;
  showMintButton?: boolean;
  onMintClick?: () => void;
}

export function BadgePreview({ trustScore, claimText, showMintButton, onMintClick }: BadgePreviewProps) {
  const getRarityInfo = (score: number) => {
    if (score >= 95) return { tier: 'Legendary', color: 'from-yellow-500 to-amber-500', glow: 'shadow-[0_0_40px_rgba(234,179,8,0.5)]' };
    if (score >= 85) return { tier: 'Epic', color: 'from-purple-500 to-pink-500', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]' };
    if (score >= 75) return { tier: 'Rare', color: 'from-blue-500 to-cyan-500', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' };
    return { tier: 'Common', color: 'from-green-500 to-emerald-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]' };
  };

  const rarity = getRarityInfo(trustScore);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
      <div className="p-6 space-y-4">
        {/* Badge Preview */}
        <div className="flex justify-center">
          <div className={`relative ${rarity.glow} rounded-full p-1 bg-gradient-to-r ${rarity.color}`}>
            <div className="bg-background rounded-full p-8">
              <Award className="h-20 w-20 text-primary" strokeWidth={1.5} />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute top-2 right-2 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Rarity & Score */}
        <div className="text-center space-y-2">
          <Badge className={`bg-gradient-to-r ${rarity.color} text-white border-0`}>
            {rarity.tier} Tier
          </Badge>
          <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {trustScore}%
          </p>
          <p className="text-sm text-muted-foreground">Trust Score</p>
        </div>

        {/* Claim Preview */}
        {claimText && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Verified Claim:</p>
            <p className="text-sm text-foreground line-clamp-2">{claimText}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground text-center">This NFT badge proves:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>✓ You verified truthful content</li>
            <li>✓ Tradeable on OpenSea marketplace</li>
            <li>✓ Permanent proof on blockchain</li>
            <li>✓ Builds your credibility score</li>
          </ul>
        </div>

        {/* Mint Button */}
        {showMintButton && onMintClick && (
          <button
            onClick={onMintClick}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Connect Wallet to Mint →
          </button>
        )}
      </div>
    </Card>
  );
}
