import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, QrCode, RefreshCw } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { polygonMainnet } from '@/lib/web3-config'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false)

  useEffect(() => {
    // Detect injected wallet (MetaMask, etc.)
    setHasInjectedWallet(typeof window !== 'undefined' && !!(window as any).ethereum)
  }, [])

  const handleResetWallet = () => {
    disconnect()
    // Clear WalletConnect v2 storage
    const wcKeys = ['wc@2:client', 'wc@2:core', 'walletconnect', 'WALLETCONNECT_DEEPLINK_CHOICE']
    wcKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error('Failed to clear storage:', e)
      }
    })
    toast({
      title: 'Wallet Reset',
      description: 'Please try connecting again',
    })
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <Button onClick={() => disconnect()} variant="outline" size="sm">
            Disconnect
          </Button>
        </div>
        {chain?.id !== polygonMainnet.id && (
          <p className="text-xs text-amber-600">⚠️ Switch to Polygon network</p>
        )}
      </div>
    )
  }

  const handleConnect = async (preferWalletConnect = false) => {
    if (isConnecting) return
    setIsConnecting(true)

    try {
      let connector
      
      // Choose connector based on preference and availability
      if (!preferWalletConnect && hasInjectedWallet && !isMobile) {
        // Use injected wallet (MetaMask) on desktop
        connector = connectors.find((c) => c.id === 'injected')
        console.info('🦊 Using injected wallet (MetaMask)')
      } else {
        // Use WalletConnect for mobile or when explicitly requested
        connector = connectors.find((c) => c.id === 'walletConnect')
        console.info('🔗 Using WalletConnect for mobile')
      }

      if (!connector) {
        toast({
          title: 'Wallet unavailable',
          description: 'No wallet connector found. Please install a Web3 wallet.',
          variant: 'destructive',
        })
        setIsConnecting(false)
        return
      }

      console.info('📱 Attempting connection...', { isMobile, connector: connector.id })

      // Connect with Polygon chain ID
      const result = await connectAsync({ 
        connector,
        chainId: polygonMainnet.id 
      })

      console.info('✅ Connected:', result.accounts[0], 'Chain:', result.chainId)

      // Switch to Polygon if needed
      if (result.chainId !== polygonMainnet.id) {
        console.info('🔄 Switching to Polygon...')
        try {
          await switchChainAsync({ chainId: polygonMainnet.id })
        } catch (switchError) {
          console.warn('⚠️ Could not auto-switch chain:', switchError)
        }
      }

      // Only show success if we have an address
      if (result.accounts[0]) {
        toast({
          title: '🎉 Wallet Connected',
          description: `Connected to ${result.accounts[0].slice(0, 6)}...${result.accounts[0].slice(-4)}`,
        })
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error)
      
      let errorMessage = 'Failed to connect. Please try again.'
      
      if (error.message?.includes('User rejected') || error.message?.includes('Connection request reset')) {
        errorMessage = 'Connection canceled. Please try again.'
      } else if (error.message?.includes('Invalid projectId')) {
        errorMessage = 'WalletConnect configuration error'
      } else if (error.message?.includes('Chain mismatch')) {
        errorMessage = 'Please switch to Polygon network in your wallet'
      } else if (error.name === 'ConnectorNotFoundError') {
        errorMessage = 'No wallet found. Please install MetaMask, Trust Wallet, or Rainbow.'
      }

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {hasInjectedWallet && !isMobile ? (
        <>
          <Button
            onClick={() => handleConnect(false)}
            disabled={isConnecting}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          <Button
            onClick={() => handleConnect(true)}
            disabled={isConnecting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            WalletConnect (QR Code)
          </Button>
        </>
      ) : (
        <Button
          onClick={() => handleConnect(true)}
          disabled={isConnecting}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}

      <Button
        onClick={handleResetWallet}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-xs"
      >
        <RefreshCw className="h-3 w-3" />
        Reset Wallet Session
      </Button>
      
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-foreground mb-1">
          📱 Supported wallets:
        </p>
        <p className="text-xs text-muted-foreground">
          MetaMask • Trust Wallet • Rainbow • Coinbase Wallet
        </p>
      </div>
    </div>
  )
}
