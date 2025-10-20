import { defineChain } from 'viem'

export const TRUTH_BADGE_CONTRACT_ADDRESS = '0x66911176b4eC70086C50b3155b04dEe433652673' as const;

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
