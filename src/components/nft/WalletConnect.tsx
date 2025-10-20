import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, Smartphone } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const isMobile = useIsMobile()
  const { toast } = useToast()

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
      const injectedConnector = connectors.find((c) => c.id === 'injected')
      const walletConnectConnector =
        connectors.find((c) => c.id === 'walletConnect') ||
        connectors.find((c: any) => c.name?.toLowerCase().includes('walletconnect')) ||
        connectors.find((c: any) => String(c.id).toLowerCase().includes('wallet'))

      const openMetaMaskDeepLink = () => {
        const cleanUrl = window.location.href
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
        window.location.href = `https://metamask.app.link/dapp/${cleanUrl}`
      }

      // Mobile flow
      if (isMobile) {
        // If MetaMask injected provider exists (in-app browser), use it directly
        if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask && injectedConnector) {
          await connect({ connector: injectedConnector })
          return
        }

        // Otherwise, deep link to MetaMask app immediately for better UX
        toast({ title: 'Opening MetaMask...', description: 'Switching to your wallet app' })
        openMetaMaskDeepLink()

        // Fallback: if we remain on page, try WalletConnect after a short delay
        setTimeout(() => {
          if (walletConnectConnector) {
            connect({ connector: walletConnectConnector })
          } else if (injectedConnector) {
            connect({ connector: injectedConnector })
          } else {
            toast({
              title: 'Wallet not detected',
              description: 'Please install MetaMask or open this page in the MetaMask browser.',
              variant: 'destructive',
            })
          }
        }, 1800)
        return
      }

      // Desktop: prefer injected (MetaMask extension)
      if (injectedConnector) {
        await connect({ connector: injectedConnector })
        return
      }

      // Desktop fallback
      if (walletConnectConnector) {
        await connect({ connector: walletConnectConnector })
        return
      }

      toast({
        title: 'No wallet found',
        description: 'Please install MetaMask to continue.',
        variant: 'destructive',
      })
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: 'Connection Failed',
        description: 'Please make sure you have MetaMask installed',
        variant: 'destructive',
      })
    }
  }

  const buttonText = isMobile ? 'Connect Wallet' : 'Connect MetaMask'
  const ButtonIcon = isMobile ? Smartphone : Wallet

  return (
    <Button
      onClick={handleConnect}
      className="flex items-center gap-2"
    >
      <ButtonIcon className="h-4 w-4" />
      {buttonText}
    </Button>
  )
}
