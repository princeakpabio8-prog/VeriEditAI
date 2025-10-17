import { defineChain } from 'viem'

export const shardeumLiberty = defineChain({
  id: 8081,
  name: 'Shardeum Liberty Testnet',
  network: 'shardeum-liberty',
  nativeCurrency: {
    decimals: 18,
    name: 'Shardeum',
    symbol: 'SHM',
  },
  rpcUrls: {
    default: {
      http: ['https://liberty10.shardeum.org/'],
    },
    public: {
      http: ['https://liberty10.shardeum.org/'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Shardeum Explorer', 
      url: 'https://explorer-liberty10.shardeum.org' 
    },
  },
  testnet: true,
})
