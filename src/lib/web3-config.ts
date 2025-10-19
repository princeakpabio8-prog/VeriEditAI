import { defineChain } from 'viem'

export const polygonMainnet = defineChain({
  id: 137,
  name: 'Polygon Mainnet',
  network: 'polygon',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://polygon-rpc.com/'],
    },
    public: {
      http: ['https://polygon-rpc.com/'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'PolygonScan', 
      url: 'https://polygonscan.com' 
    },
  },
  testnet: false,
})
