import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award, Sparkles, X } from 'lucide-react';
import { MintBadgeButton } from './MintBadgeButton';
import { Button } from '@/components/ui/button';

interface NFTMintPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationId: string;
  trustScore: number;
  claimText?: string;
}

export function NFTMintPromptModal({ 
  isOpen, 
  onClose, 
  verificationId, 
  trustScore,
  claimText 
}: NFTMintPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] bg-gradient-to-b from-background via-background to-purple-950/10 border-purple-500/20">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-full hover:bg-white/10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className="space-y-6 pt-2">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <Award className="h-20 w-20 text-purple-500 relative z-10" strokeWidth={1.5} />
              <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse z-20" />
            </div>
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-center text-3xl font-bold">
              🎉 Congratulations!
            </DialogTitle>
            <DialogDescription className="text-center text-base font-medium text-foreground">
              Your verification qualifies for a Truth Badge NFT!
            </DialogDescription>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/40 border border-purple-500/30 rounded-xl p-6 space-y-2">
            <p className="text-sm text-muted-foreground text-center">Trust Score Achieved:</p>
            <p className="text-5xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {trustScore}%
            </p>
          </div>

          {claimText && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Verified Claim:</p>
              <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <p className="text-sm text-foreground/90 line-clamp-3">{claimText}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center px-4">
            Mint your unique NFT badge on the Polygon blockchain. This NFT represents your contribution to truth verification!
          </p>
        </DialogHeader>
        
        <div className="pt-2 pb-2">
          <MintBadgeButton 
            verificationId={verificationId} 
            trustScore={trustScore}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
