import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Award, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { BadgeRevealModal } from './BadgeRevealModal'
import { BadgePreview } from './BadgePreview'
import { MobileNFTMintFlow } from './MobileNFTMintFlow'
import { useIsMobile } from '@/hooks/use-mobile'

interface MintBadgeButtonProps {
  verificationId: string
  trustScore: number
}

export function MintBadgeButton({ verificationId, trustScore }: MintBadgeButtonProps) {
  const { address, isConnected, chain } = useAccount()
  const isReallyConnected = isConnected && !!address
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { connectAsync, connectors } = useConnect()
  const [minting, setMinting] = useState(false)
  const [alreadyMinted, setAlreadyMinted] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [mintedBadge, setMintedBadge] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showMobileFlow, setShowMobileFlow] = useState(false)

  useEffect(() => {
    checkExistingBadge()
  }, [verificationId])

  const checkExistingBadge = async () => {
    const { data } = await supabase
      .from('nft_badges')
      .select('id')
      .eq('verification_id', verificationId)
      .maybeSingle()
    
    setAlreadyMinted(!!data)
  }

  const getBadgeType = (score: number): "common" | "uncommon" | "rare" | "epic" | "legendary" => {
    if (score >= 95) return "legendary";
    if (score >= 90) return "epic";
    if (score >= 85) return "rare";
    if (score >= 75) return "uncommon";
    return "common";
  }

  const handleMintClick = () => {
    if (isMobile) {
      setShowMobileFlow(true);
    } else {
      handleMint();
    }
  }

  const handleConnectWallet = async () => {
    try {
      // Try WalletConnect first (opens modal with all wallet options)
      const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect')
      if (walletConnectConnector) {
        await connectAsync({ connector: walletConnectConnector })
        return
      }

      // Fallback to injected
      const injectedConnector = connectors.find((c) => c.id === 'injected')
      if (injectedConnector) {
        await connectAsync({ connector: injectedConnector })
      } else {
        toast({ 
          title: 'No wallet found', 
          description: 'Please open this page in your wallet app browser.', 
          variant: 'destructive' 
        })
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast({ 
        title: 'Connection Failed', 
        description: 'Please try again.', 
        variant: 'destructive' 
      })
    }
  }

  const handleMint = async () => {
    if (!isReallyConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive"
      })
      return
    }

    if (trustScore < 70) {
      toast({
        title: "Trust Score Too Low",
        description: "Trust score must be ≥70% to mint a badge",
        variant: "destructive"
      })
      return
    }

    setMinting(true)

    try {
      const { data, error } = await supabase.functions.invoke('mint-truth-badge', {
        body: {
          verificationId,
          walletAddress: address
        }
      })

      if (error) throw error

      // Get verification details for the modal
      const { data: verification } = await supabase
        .from('verifications')
        .select('content')
        .eq('id', verificationId)
        .single()

      // Show success toast immediately
      toast({
        title: "🎉 Badge Minted Successfully!",
        description: "Your Truth Badge NFT has been minted! It will appear on OpenSea within 24 hours.",
      })

      // Show epic reveal modal
      setMintedBadge({
        tokenId: data.tokenId,
        trustScore,
        claimText: verification?.content || 'Verified claim',
        explorerUrl: data.explorerUrl,
      })
      setShowReveal(true)
      setAlreadyMinted(true)
      setMinting(false)

      // Trigger gallery refresh via custom event
      window.dispatchEvent(new CustomEvent('nft-badge-minted', { 
        detail: { tokenId: data.tokenId, verificationId } 
      }))

    } catch (error: any) {
      console.error('Minting error:', error)
      
      let errorMessage = error.message || "An error occurred while minting"
      
      // Provide helpful error messages
      if (errorMessage.includes('not configured')) {
        errorMessage = "NFT minting requires admin setup. Please contact support at hello@verieditai.com to enable this feature."
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = "Insufficient MATIC for gas fees. Please add funds to the minting wallet."
      } else if (errorMessage.includes('already minted')) {
        errorMessage = "This claim has already been minted as an NFT."
      }
      
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive"
      })
      setMinting(false)
    }
  }

  if (alreadyMinted) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <Award className="h-4 w-4" />
        Badge Already Minted
      </Button>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Connect Wallet + Mint - streamlined for mobile */}
        {!isReallyConnected ? (
          <>
            <Button 
              onClick={handleConnectWallet} 
              variant="default" 
              className="w-full h-12 text-base font-semibold"
            >
              🔗 Connect Wallet to Mint
            </Button>
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
            >
              {showPreview ? 'Hide Preview' : '👁️ Preview Badge'}
            </Button>
            {showPreview && (
              <BadgePreview 
                trustScore={trustScore}
                showMintButton={false}
              />
            )}
          </>
        ) : (
          <Button
            onClick={handleMintClick}
            disabled={minting || trustScore < 70}
            className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 w-full h-12 text-base font-semibold"
          >
            {minting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Award className="h-4 w-4" />
                Mint Truth Badge NFT
              </>
            )}
          </Button>
        )}

        {trustScore < 70 && (
          <p className="text-xs text-muted-foreground text-center">
            ℹ️ Trust score must be ≥70% to mint (currently {trustScore}%)
          </p>
        )}
      </div>

      {mintedBadge && (
        <BadgeRevealModal
          open={showReveal}
          onClose={() => setShowReveal(false)}
          badgeData={mintedBadge}
        />
      )}

      {isMobile && (
        <MobileNFTMintFlow
          isOpen={showMobileFlow}
          onClose={() => setShowMobileFlow(false)}
          badgeType={getBadgeType(trustScore)}
          verificationId={verificationId}
        />
      )}
    </>
  )
}
