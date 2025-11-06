import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polygonMainnet } from '@/lib/web3-config'
import { injected } from 'wagmi/connectors'

// Wallet connectors: only injected for maximum compatibility on mobile
const connectorsList = [
  injected({ shimDisconnect: true }),
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
