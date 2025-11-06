import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { polygonMainnet } from '@/lib/web3-config'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

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

  const handleConnect = async (connectorId?: string) => {
    if (isConnecting) return
    setIsConnecting(true)

    try {
      // Use specified connector or try injected first, then walletConnect
      let connector = connectorId 
        ? connectors.find((c) => c.id === connectorId)
        : connectors.find((c) => c.id === 'injected') || connectors.find((c) => c.id === 'walletConnect')

      if (!connector) {
        toast({
          title: 'Wallet unavailable',
          description: 'Please install a Web3 wallet or use WalletConnect.',
          variant: 'destructive',
        })
        setIsConnecting(false)
        return
      }

      console.info('📱 Connecting wallet via', connector.name)

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
      } else if (error.message?.includes('Chain mismatch')) {
        errorMessage = 'Please switch to Polygon network in your wallet'
      } else if (error.name === 'ConnectorNotFoundError') {
        errorMessage = 'No wallet found. Please install a Web3 wallet app.'
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => handleConnect('injected')}
          disabled={isConnecting}
          className="flex items-center gap-2"
          variant="default"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Mobile Wallet'}
        </Button>
        
        <Button
          onClick={() => handleConnect('walletConnect')}
          disabled={isConnecting}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'WalletConnect QR'}
        </Button>
      </div>
      
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-foreground mb-1">
          📱 Choose your connection:
        </p>
        <p className="text-xs text-muted-foreground">
          Mobile Wallet: MetaMask, Trust Wallet, Rainbow apps
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          WalletConnect: Scan QR code with any wallet
        </p>
      </div>
    </div>
  )
}
