import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected, walletConnect } from 'wagmi/connectors'

// WalletConnect Project ID for mobile wallet support
const projectId = 'c8e3b1c8d8e8f8a8b8c8d8e8f8a8b8c8'

// Wallet connectors: injected + WalletConnect for seamless mobile experience
const connectorsList = [
  injected({ shimDisconnect: true }),
  walletConnect({
    projectId,
    metadata: {
      name: 'Truth Lighthouse',
      description: 'Verify claims and mint Truth Badge NFTs',
      url: 'https://0c43cf4d-e9e1-4158-ae12-b606b1393a45.lovableproject.com',
      icons: ['https://0c43cf4d-e9e1-4158-ae12-b606b1393a45.lovableproject.com/favicon.ico']
    },
    showQrModal: true,
  }),
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
