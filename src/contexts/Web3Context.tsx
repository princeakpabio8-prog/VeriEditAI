import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { shardeumLiberty } from '@/lib/web3-config'
import { injected } from 'wagmi/connectors'

const config = createConfig({
  chains: [shardeumLiberty],
  connectors: [
    injected(), // MetaMask
  ],
  transports: {
    [shardeumLiberty.id]: http(),
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
