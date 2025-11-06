import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected, walletConnect } from 'wagmi/connectors'

const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

// Disable WalletConnect modal on preview domains to avoid allowlist "Invalid website" error
const isPreviewDomain = typeof window !== 'undefined' && /lovableproject\.com|localhost|127\.0\.0\.1/i.test(window.location.hostname)
const enableWalletConnect = !!WC_PROJECT_ID && !isPreviewDomain

const connectorsList = [
  injected({ shimDisconnect: true }), // MetaMask, Trust Wallet, Rainbow, etc.
  ...(enableWalletConnect
    ? [
        walletConnect({
          projectId: WC_PROJECT_ID!,
          metadata: {
            name: 'TruthLens',
            description: 'Verify claims and earn Truth Badges',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://truthlens.app',
            icons: ['https://truthlens.app/favicon.ico'],
          },
          showQrModal: true,
        }),
      ]
    : []),
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
