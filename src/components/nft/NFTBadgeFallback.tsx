import { useState, useEffect } from 'react'

interface NFTBadgeFallbackProps {
  rarity: string | null
  trustScore: number
  claimText: string
  tokenId?: string
}

/**
 * NFTBadgeFallback - Visual fallback for badge display
 * 
 * IMPORTANT: This component is for visual display only when image loading fails.
 * It does NOT trigger AI generation or any background processes.
 * All badges use Canva templates stored in Supabase Storage.
 */

export function NFTBadgeFallback({ rarity, trustScore, claimText, tokenId }: NFTBadgeFallbackProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate particles for high-tier rarities
    if (rarity === 'LEGENDARY' || rarity === 'EPIC') {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }))
      setParticles(newParticles)
    }
  }, [rarity])

  const getRarityGradient = (r: string | null) => {
    switch (r) {
      case 'LEGENDARY':
        return 'from-yellow-400 via-orange-500 to-red-600'
      case 'EPIC':
        return 'from-purple-400 via-pink-500 to-fuchsia-600'
      case 'RARE':
        return 'from-blue-400 via-cyan-500 to-teal-600'
      case 'UNCOMMON':
        return 'from-green-400 via-emerald-500 to-lime-600'
      default:
        return 'from-slate-400 via-gray-500 to-zinc-600'
    }
  }

  const getRarityIcon = (r: string | null) => {
    switch (r) {
      case 'LEGENDARY':
        return '⚡'
      case 'EPIC':
        return '💎'
      case 'RARE':
        return '🔥'
      case 'UNCOMMON':
        return '✨'
      default:
        return '🏅'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getRarityGradient(rarity)} animate-gradient`} />
      
      {/* Particles for high-tier rarities */}
      {(rarity === 'LEGENDARY' || rarity === 'EPIC') && (
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-white rounded-full animate-float"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center space-y-3">
        {/* Icon */}
        <div className="text-6xl animate-pulse">
          {getRarityIcon(rarity)}
        </div>
        
        {/* Trust Score */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border-2 border-white/40">
          <span className="text-white font-bold text-2xl">{trustScore}%</span>
        </div>
        
        {/* Token ID */}
        {tokenId && (
          <div className="text-white/90 text-xs font-mono">
            #{tokenId}
          </div>
        )}
        
        {/* Claim preview */}
        <div className="text-white/80 text-xs max-w-[80%] line-clamp-2 font-medium">
          {truncateText(claimText, 60)}
        </div>
        
        {/* Badge label */}
        <div className="text-white/60 text-[10px] uppercase tracking-wider">
          Truth Badge
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
      
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
