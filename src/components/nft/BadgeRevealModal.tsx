import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ExternalLink, Image, Share2, X } from 'lucide-react'
import badgeImage from '@/assets/truth-badge.png'
import { useEffect, useState } from 'react'

interface BadgeRevealModalProps {
  open: boolean
  onClose: () => void
  badgeData: {
    tokenId: string
    trustScore: number
    claimText: string
    explorerUrl: string
  }
}

export function BadgeRevealModal({ open, onClose, badgeData }: BadgeRevealModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleShare = () => {
    const text = `I just minted a Truth Badge NFT with ${badgeData.trustScore}% trust score on Polygon! 🎖️\n\n${badgeData.explorerUrl}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto border-primary/20 bg-gradient-to-b from-background to-background/95 backdrop-blur-xl mx-2 sm:mx-auto pb-[env(safe-area-inset-bottom,0px)]">
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: -20,
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                }}
                animate={{
                  y: [0, 600],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-6 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 20,
              duration: 0.8 
            }}
            className="relative"
          >
            <motion.div
              className="absolute inset-0 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
              }}
            />
            
             <img 
               src={badgeImage} 
               alt="Truth Badge" 
               className="relative h-32 w-32 sm:h-48 sm:w-48 object-contain drop-shadow-2xl"
             />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Badge Minted Successfully! 🎖️
            </h2>
            <p className="text-muted-foreground">
              Your Proof of Verification is now on Polygon Mainnet
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full space-y-3 rounded-lg border border-border bg-card/50 p-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Token ID</span>
              <span className="font-mono font-semibold">#{badgeData.tokenId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trust Score</span>
              <span className="font-bold text-primary">{badgeData.trustScore}%</span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {badgeData.claimText}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-2 w-full"
          >
            <Button
              onClick={() => window.open(badgeData.explorerUrl, '_blank')}
              className="flex-1 gap-2 h-11"
              variant="default"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">PolygonScan</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/profile'}
              className="flex-1 gap-2 h-11"
              variant="outline"
            >
              <Image className="h-4 w-4" />
              <span className="text-sm">Gallery</span>
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 gap-2 h-11"
              variant="outline"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
