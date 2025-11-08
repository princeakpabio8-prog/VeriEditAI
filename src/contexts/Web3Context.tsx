import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected, walletConnect } from 'wagmi/connectors'

// WalletConnect Project ID for mobile wallet support (must be a valid WC Cloud ID)
const projectId = 'dbae4abd3d9932d5f06d2e067f61a67e'
const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://trust-lighthouse.lovable.app'

// Wallet connectors: injected + WalletConnect for seamless mobile experience
const hasValidWC = !!projectId && projectId.length >= 32
const connectorsList = [
  injected({ shimDisconnect: true }),
  ...(
    hasValidWC
      ? [walletConnect({
          projectId,
          metadata: {
            name: 'VeriEdit AI',
            description: 'Verify claims and mint Truth Badge NFTs',
            url: appUrl,
            icons: [`${appUrl}/favicon.ico`],
          },
          showQrModal: true,
        })]
      : []
  ),
]


const config = createConfig({
  chains: [polygonMainnet],
  connectors: connectorsList,
  transports: {
    [polygonMainnet.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
