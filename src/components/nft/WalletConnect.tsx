import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, Smartphone } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const isMobile = useIsMobile()

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

  // On mobile, prefer WalletConnect
  const preferredConnector = isMobile 
    ? connectors.find(c => c.id === 'walletConnect') || connectors[0]
    : connectors[0]

  const buttonText = isMobile ? 'Connect Wallet' : 'Connect MetaMask'
  const ButtonIcon = isMobile ? Smartphone : Wallet

  return (
    <Button
      onClick={() => connect({ connector: preferredConnector })}
      className="flex items-center gap-2"
    >
      <ButtonIcon className="h-4 w-4" />
      {buttonText}
    </Button>
  )
}
