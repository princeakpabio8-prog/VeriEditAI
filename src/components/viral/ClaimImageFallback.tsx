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
    <div className="relative w-full aspect-[16/9] max-h-[300px] overflow-hidden group">
      {/* Multi-layer animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses(rarityTier)}`}>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 claim-fallback-shimmer opacity-40" />
        {/* Secondary gradient layer */}
        <div className={`absolute inset-0 bg-gradient-to-tl ${getGradientClasses(rarityTier)} opacity-30 mix-blend-overlay`} />
      </div>

      {/* Floating particles - more dynamic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="claim-fallback-particles absolute top-[10%] left-[15%] w-4 h-4 rounded-full bg-white/40 blur-sm" />
        <div className="claim-fallback-particles absolute top-[60%] left-[80%] w-3 h-3 rounded-full bg-white/50 blur-sm" style={{ animationDelay: '1s' }} />
        <div className="claim-fallback-particles absolute top-[30%] right-[20%] w-5 h-5 rounded-full bg-white/30 blur-sm" style={{ animationDelay: '2s' }} />
        <div className="claim-fallback-particles absolute bottom-[20%] left-[40%] w-3 h-3 rounded-full bg-white/45 blur-sm" style={{ animationDelay: '0.5s' }} />
        <div className="claim-fallback-particles absolute top-[45%] right-[60%] w-6 h-6 rounded-full bg-white/25 blur-md" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Large platform icon watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="text-white text-[200px] leading-none">
          {getPlatformIcon(platform)}
        </div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
        {/* Top badges */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            {showRaceBadge && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs md:text-sm px-2 md:px-3 py-1 shadow-lg animate-pulse w-fit">
                🔥 RACE TO VERIFY
              </Badge>
            )}
            <Badge
              className={`bg-gradient-to-r ${getGradientClasses(rarityTier)} text-white font-bold shadow-lg w-fit text-xs md:text-sm px-2 md:px-3 py-1`}
            >
              {getRarityIcon(rarityTier)} {getRarityDisplayName(rarityTier)}
            </Badge>
          </div>
          
          {/* Rank badge */}
          {rank && (
            <div className="bg-black/70 backdrop-blur-sm rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xl md:text-2xl shadow-lg border-2 border-white/20">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
            </div>
          )}
        </div>

        {/* Center - Claim text with larger platform icon */}
        <div className="flex-1 flex flex-col justify-center space-y-3 md:space-y-4">
          <div className="text-white/90 text-6xl md:text-7xl mb-2 drop-shadow-2xl">
            {getPlatformIcon(platform)}
          </div>
          <p className="text-white font-bold text-xl md:text-2xl lg:text-3xl line-clamp-4 drop-shadow-2xl leading-tight">
            {claimText}
          </p>
        </div>

        {/* Bottom - Platform & engagement */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white text-xs font-semibold">
            {platform}
          </Badge>
          <div className="text-white/90 text-sm md:text-base font-bold flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-lg md:text-xl">📊</span>
            {engagementScore.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses(rarityTier)} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
    </div>
  );
}
