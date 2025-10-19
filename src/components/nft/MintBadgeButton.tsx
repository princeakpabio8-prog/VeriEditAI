import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Award, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WalletConnect } from './WalletConnect'

interface MintBadgeButtonProps {
  verificationId: string
  trustScore: number
}

export function MintBadgeButton({ verificationId, trustScore }: MintBadgeButtonProps) {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [minting, setMinting] = useState(false)
  const [alreadyMinted, setAlreadyMinted] = useState(false)

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

      toast({
        title: "🎖️ Proof of Verification Badge Minted!",
        description: `Successfully minted on Polygon Mainnet. You've earned your place in the Truth Network.`,
        duration: 10000
      })

      setAlreadyMinted(true)

      if (data?.explorerUrl) {
        window.open(data.explorerUrl, '_blank')
      }

    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "An error occurred while minting",
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
    <div className="flex flex-col gap-3">
      {!isConnected && <WalletConnect />}
      
      <Button
        onClick={handleMint}
        disabled={!isConnected || minting || trustScore < 75}
        className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
      >
        {minting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Minting Badge...
          </>
        ) : (
          <>
            <Award className="h-4 w-4" />
            Mint Truth Badge NFT
          </>
        )}
      </Button>

      {trustScore < 75 && (
        <p className="text-xs text-muted-foreground">
          ℹ️ Trust score must be ≥75% to mint a badge (currently {trustScore}%)
        </p>
      )}
    </div>
  )
}
