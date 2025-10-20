import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected, walletConnect } from 'wagmi/connectors'

const config = createConfig({
  chains: [polygonMainnet],
  connectors: [
    injected(), // MetaMask browser extension
    walletConnect({
      projectId: 'e8b2c8c0d5f8a4b3c2d1e0f9a8b7c6d5', // Free WalletConnect project ID
      metadata: {
        name: 'VerifiedIT AI',
        description: 'Truth Badge NFT Platform',
        url: 'https://verifiedit.ai',
        icons: ['https://verifiedit.ai/favicon.ico']
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
