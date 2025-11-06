import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected, walletConnect } from 'wagmi/connectors'

const config = createConfig({
  chains: [polygonMainnet],
  connectors: [
    injected({ shimDisconnect: true }), // MetaMask browser extension
    walletConnect({
      projectId: '843739133fe7e0d25cf036467a96623e', // Your verified WalletConnect Cloud project
      metadata: {
        name: 'VeriEdit AI',
        description: 'Truth Badge NFT Platform - Verify and mint NFT badges',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://trust-lighthouse.lovable.app',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://trust-lighthouse.lovable.app/favicon.ico']
      },
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '9999'
        }
      }
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
