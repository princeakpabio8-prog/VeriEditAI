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

  // Helper to open in MetaMask browser
  const openInMetaMaskBrowser = () => {
    const cleanUrl = window.location.href
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
    window.location.href = `https://metamask.app.link/dapp/${cleanUrl}`
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleConnect}
        className="flex items-center gap-2"
      >
        <ButtonIcon className="h-4 w-4" />
        {buttonText}
      </Button>
      
      {/* Android-specific help */}
      {isMobile && isAndroid && !isMetaMaskBrowser && (
        <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Android Users:</strong> Open this page in MetaMask browser for best experience
          </p>
          <Button
            onClick={openInMetaMaskBrowser}
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            Open in MetaMask Browser
          </Button>
        </div>
      )}
      
      {/* Success indicator for MetaMask browser */}
      {isMetaMaskBrowser && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✅ MetaMask detected - ready to connect
        </p>
      )}
    </div>
  )
}
