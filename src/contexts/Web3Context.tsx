import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected, walletConnect } from 'wagmi/connectors'

const config = createConfig({
  chains: [polygonMainnet],
  connectors: [
    injected({ shimDisconnect: true }), // MetaMask, Trust Wallet, Rainbow, etc.
    walletConnect({
      projectId: 'a3c9c1e5f8e4d2b1a9c8d7e6f5a4b3c2', // Demo project ID
      metadata: {
        name: 'TruthLens',
        description: 'Verify claims and earn Truth Badges',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://truthlens.app',
        icons: ['https://truthlens.app/favicon.ico'],
      },
      showQrModal: true,
    }),
  ],
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
