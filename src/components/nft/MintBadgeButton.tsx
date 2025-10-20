import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Award, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WalletConnect } from './WalletConnect'
import { BadgeRevealModal } from './BadgeRevealModal'

interface MintBadgeButtonProps {
  verificationId: string
  trustScore: number
}

export function MintBadgeButton({ verificationId, trustScore }: MintBadgeButtonProps) {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [minting, setMinting] = useState(false)
  const [alreadyMinted, setAlreadyMinted] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [mintedBadge, setMintedBadge] = useState<any>(null)

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

  const handleMint = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive"
      })
      return
    }

    if (trustScore < 75) {
      toast({
        title: "Trust Score Too Low",
        description: "Trust score must be ≥75% to mint a badge",
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

      // Show epic reveal modal
      setMintedBadge({
        tokenId: data.tokenId,
        trustScore,
        claimText: verification?.content || 'Verified claim',
        explorerUrl: data.explorerUrl,
      })
      setShowReveal(true)
      setAlreadyMinted(true)

    } catch (error: any) {
      console.error('Minting error:', error)
      
      let errorMessage = error.message || "An error occurred while minting"
      
      // Provide helpful error messages
      if (errorMessage.includes('not configured')) {
        errorMessage = "NFT minting requires admin setup. Please contact support to enable this feature."
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
    } finally {
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
      <div className="flex flex-col gap-3 w-full">
        {!isConnected && <WalletConnect />}
        
        <Button
          onClick={handleMint}
          disabled={!isConnected || minting || trustScore < 75}
          className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 w-full sm:w-auto text-sm"
          size="sm"
        >
          {minting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Minting Badge...</span>
              <span className="sm:hidden">Minting...</span>
            </>
          ) : (
            <>
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Mint Truth Badge NFT</span>
              <span className="sm:hidden">Mint NFT</span>
            </>
          )}
        </Button>

        {trustScore < 75 && (
          <p className="text-xs text-muted-foreground">
            ℹ️ Trust score must be ≥75% to mint a badge (currently {trustScore}%)
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
    </>
  )
}
