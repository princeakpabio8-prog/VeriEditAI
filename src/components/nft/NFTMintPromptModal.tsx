import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award, Sparkles } from 'lucide-react';
import { MintBadgeButton } from './MintBadgeButton';

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Award className="h-16 w-16 text-purple-600" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            🎉 Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p className="text-base font-semibold text-foreground">
              Your verification qualifies for a Truth Badge NFT!
            </p>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Trust Score Achieved:</p>
              <p className="text-3xl font-bold text-purple-600">{trustScore}%</p>
            </div>
            {claimText && (
              <div className="bg-muted/50 rounded-lg p-3 text-left">
                <p className="text-xs text-muted-foreground mb-1">Verified Claim:</p>
                <p className="text-sm font-medium line-clamp-3">{claimText}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Mint your unique NFT badge on the Polygon blockchain. This NFT represents your contribution to truth verification!
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <MintBadgeButton 
            verificationId={verificationId} 
            trustScore={trustScore}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
