import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award, Sparkles, X, HelpCircle, ChevronDown } from 'lucide-react';
import { MintBadgeButton } from './MintBadgeButton';
import { Button } from '@/components/ui/button';
import { WalletSetupGuide } from './WalletSetupGuide';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[540px] bg-gradient-to-b from-background via-background to-purple-950/10 border-purple-500/20",
        isMobile && "max-h-[85vh] overflow-y-auto pb-32"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-full hover:bg-white/10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className={cn("space-y-6 pt-2", isMobile && "space-y-4")}>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <Award className={cn("text-purple-500 relative z-10", isMobile ? "h-16 w-16" : "h-20 w-20")} strokeWidth={1.5} />
              <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse z-20" />
            </div>
          </div>

          <div className="space-y-2">
            <DialogTitle className={cn("text-center font-bold", isMobile ? "text-2xl" : "text-3xl")}>
              🎉 Congratulations!
            </DialogTitle>
            <DialogDescription className="text-center text-base font-medium text-foreground">
              Your verification qualifies for a Truth Badge NFT!
            </DialogDescription>
          </div>

          <div className={cn(
            "bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/40 border border-purple-500/30 rounded-xl space-y-2",
            isMobile ? "p-4" : "p-6"
          )}>
            <p className="text-sm text-muted-foreground text-center">Trust Score Achieved:</p>
            <p className={cn(
              "font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
              isMobile ? "text-4xl" : "text-5xl"
            )}>
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

          {isMobile ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowBenefits(!showBenefits)}
                className="flex items-center justify-between w-full text-sm font-medium text-foreground"
              >
                <span>Why Mint This Badge?</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showBenefits && "rotate-180"
                )} />
              </button>
              {showBenefits && (
                <ul className="text-xs text-muted-foreground space-y-1 px-4">
                  <li>🏆 Proves your contribution to fighting misinformation</li>
                  <li>💎 Tradeable on OpenSea marketplace</li>
                  <li>🔒 Permanent proof stored on blockchain</li>
                  <li>📈 Higher scores = rarer badges = more value</li>
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Why Mint This Badge?</p>
              <ul className="text-xs text-muted-foreground space-y-1 px-4">
                <li>🏆 Proves your contribution to fighting misinformation</li>
                <li>💎 Tradeable on OpenSea marketplace</li>
                <li>🔒 Permanent proof stored on blockchain</li>
                <li>📈 Higher scores = rarer badges = more value</li>
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center px-4">
            Minting is free! Only pay minimal gas fees (~$0.02 on Polygon)
          </p>
        </DialogHeader>
        
        <div className={cn(
          "pt-2 pb-2 space-y-4",
          isMobile && [
            "fixed bottom-0 left-0 right-0",
            "bg-background/95 backdrop-blur-sm",
            "border-t border-border/50",
            "px-6 py-4",
            "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]",
            "z-50"
          ]
        )}>
          {showWalletGuide ? (
            <div className="space-y-4">
              <WalletSetupGuide />
              <Button
                variant="outline"
                onClick={() => setShowWalletGuide(false)}
                className="w-full"
              >
                ← Back to Minting
              </Button>
            </div>
          ) : (
            <>
              <MintBadgeButton 
                verificationId={verificationId} 
                trustScore={trustScore}
              />
              
              {/* Help Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWalletGuide(true)}
                className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-4 w-4" />
                Don't have a wallet? Click here for setup guide
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
