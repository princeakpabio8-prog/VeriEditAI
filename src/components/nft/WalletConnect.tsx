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
      // On mobile, try to detect and open installed wallet apps
      if (isMobile) {
        const injectedConnector = connectors.find(c => c.id === 'injected')
        const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
        
        // First try injected (MetaMask mobile browser or in-app browser)
        if (injectedConnector) {
          try {
            await connect({ connector: injectedConnector })
            return
          } catch (error) {
            // If injected fails, try to open MetaMask app
            const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
            window.location.href = metamaskDeepLink
            
            // Wait a bit to see if app opened
            setTimeout(() => {
              // If still here, fall back to WalletConnect
              if (walletConnectConnector) {
                connect({ connector: walletConnectConnector })
              }
            }, 2000)
            return
          }
        }
        
        // Fall back to WalletConnect which will show mobile wallet options
        if (walletConnectConnector) {
          await connect({ connector: walletConnectConnector })
        }
      } else {
        // Desktop: use injected (MetaMask extension)
        const injectedConnector = connectors[0]
        await connect({ connector: injectedConnector })
      }
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: 'Connection Failed',
        description: 'Please make sure you have MetaMask installed',
        variant: 'destructive'
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
