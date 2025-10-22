import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, Smartphone, ExternalLink } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [isAndroid, setIsAndroid] = useState(false)
  const [isMetaMaskBrowser, setIsMetaMaskBrowser] = useState(false)

  useEffect(() => {
    // Detect Android
    const userAgent = navigator.userAgent.toLowerCase()
    setIsAndroid(/android/.test(userAgent))
    
    // Detect MetaMask in-app browser
    setIsMetaMaskBrowser(typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask)
  }, [])

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button onClick={() => disconnect()} variant="outline" size="sm">
          Disconnect
        </Button>
      </div>
    )
  }

  const handleConnect = async () => {
    try {
      // Simplified: Always use WalletConnect (works everywhere)
      const walletConnectConnector =
        connectors.find((c) => c.id === 'walletConnect') ||
        connectors.find((c: any) => c.name?.toLowerCase().includes('walletconnect'))

      if (!walletConnectConnector) {
        toast({
          title: 'Wallet connection unavailable',
          description: 'Please try again later',
          variant: 'destructive',
        })
        return
      }

      await connect({ connector: walletConnectConnector })
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to your wallet',
      })
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: 'Connection Failed',
        description: 'Please try again or use a different wallet',
        variant: 'destructive',
      })
    }
  }

  const buttonText = 'Connect Wallet'
  const ButtonIcon = Wallet

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleConnect}
        className="flex items-center gap-2"
      >
        <ButtonIcon className="h-4 w-4" />
        {buttonText}
      </Button>
      
      {/* Wallet support info */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-foreground mb-1">
          📱 Works with all major wallets:
        </p>
        <p className="text-xs text-muted-foreground">
          MetaMask • Trust Wallet • Rainbow • Coinbase Wallet
        </p>
      </div>
    </div>
  )
}
