import { Badge } from '@/components/ui/badge';

interface ClaimImageFallbackProps {
  claimText: string;
  platform: string;
  rarityTier?: string;
  engagementScore: number;
  rank?: number;
  showRaceBadge?: boolean;
}

export function ClaimImageFallback({ 
  claimText, 
  platform, 
  rarityTier = 'COMMON', 
  engagementScore,
  rank,
  showRaceBadge 
}: ClaimImageFallbackProps) {
  
  const getGradientClasses = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'from-amber-300 via-yellow-500 to-orange-600'; // Divine Gold
      case 'EPIC':
        return 'from-purple-400 via-fuchsia-500 to-pink-600'; // Purple-Pink
      case 'RARE':
        return 'from-cyan-400 via-blue-500 to-indigo-600'; // Electric Blue
      case 'UNCOMMON':
        return 'from-emerald-400 via-teal-500 to-green-600'; // Green-Gold
      default:
        return 'from-slate-400 via-slate-500 to-slate-600'; // Silver
    }
  };

  const getRarityDisplayName = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'MYTHIC';
      case 'EPIC':
        return 'SUPREME';
      case 'RARE':
        return 'ELITE';
      case 'UNCOMMON':
        return 'DISTINGUISHED';
      default:
        return 'VERIFIED';
    }
  };

  const getRarityIcon = (rarity: string) => {
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

  const getPlatformIcon = (platformName: string) => {
    const lower = platformName.toLowerCase();
    if (lower.includes('twitter') || lower.includes('x')) return '𝕏';
    if (lower.includes('reddit')) return '🔴';
    if (lower.includes('youtube')) return '▶️';
    if (lower.includes('facebook')) return '📘';
    if (lower.includes('instagram')) return '📷';
    return '📰';
  };

  return (
    <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-t-lg group">
      {/* Animated mesh gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses(rarityTier)}`}>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 claim-fallback-shimmer opacity-40" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="claim-fallback-particles absolute top-[10%] left-[15%] w-3 h-3 rounded-full bg-white/30 blur-sm" />
        <div className="claim-fallback-particles absolute top-[60%] left-[80%] w-2 h-2 rounded-full bg-white/40 blur-sm" style={{ animationDelay: '1s' }} />
        <div className="claim-fallback-particles absolute top-[30%] right-[20%] w-4 h-4 rounded-full bg-white/20 blur-sm" style={{ animationDelay: '2s' }} />
        <div className="claim-fallback-particles absolute bottom-[20%] left-[40%] w-2 h-2 rounded-full bg-white/35 blur-sm" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* Top badges */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            {showRaceBadge && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm px-3 py-1 shadow-lg animate-pulse w-fit">
                🔥 RACE TO VERIFY
              </Badge>
            )}
            <Badge
              className={`bg-gradient-to-r ${getGradientClasses(rarityTier)} text-white font-bold shadow-lg w-fit`}
            >
              {getRarityIcon(rarityTier)} {getRarityDisplayName(rarityTier)}
            </Badge>
          </div>
          
          {/* Rank badge */}
          {rank && (
            <div className="bg-black/60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
            </div>
          )}
        </div>

        {/* Center - Claim text */}
        <div className="space-y-3">
          <div className="text-white/90 text-5xl mb-2">
            {getPlatformIcon(platform)}
          </div>
          <p className="text-white font-bold text-2xl md:text-3xl line-clamp-3 drop-shadow-lg leading-tight">
            {claimText}
          </p>
        </div>

        {/* Bottom - Platform & engagement */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white text-xs">
            {platform}
          </Badge>
          <div className="text-white/80 text-sm font-semibold flex items-center gap-1">
            <span className="text-lg">📊</span>
            {engagementScore.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses(rarityTier)} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
    </div>
  );
}
