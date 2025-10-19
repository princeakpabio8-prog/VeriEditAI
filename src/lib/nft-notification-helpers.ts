import { createNotification, CreateNotificationParams } from './notification-helpers';

export interface NFTSaleNotification {
  userId: string;
  tokenId: string;
  salePrice: number;
  royaltyAmount: number;
  platform?: string;
  transactionHash?: string;
}

export interface NFTListingNotification {
  userId: string;
  tokenId: string;
  listingPrice: number;
  listingUrl?: string;
  platform?: string;
}

export const notifyNFTSale = async ({
  userId,
  tokenId,
  salePrice,
  royaltyAmount,
  platform = 'OpenSea',
  transactionHash,
}: NFTSaleNotification) => {
  return createNotification({
    userId,
    type: 'nft_sold',
    message: `Your Truth Badge #${tokenId} sold for ${salePrice.toFixed(4)} MATIC! Earned ${royaltyAmount.toFixed(4)} MATIC in royalties.`,
    actionUrl: `/nft/marketplace?badge=${tokenId}`,
    metadata: {
      token_id: tokenId,
      sale_price: salePrice,
      royalty_amount: royaltyAmount,
      platform,
      transaction_hash: transactionHash,
    },
  });
};

export const notifyNFTListing = async ({
  userId,
  tokenId,
  listingPrice,
  listingUrl,
  platform = 'OpenSea',
}: NFTListingNotification) => {
  return createNotification({
    userId,
    type: 'nft_listed',
    message: `Your Truth Badge #${tokenId} listed for ${listingPrice.toFixed(4)} MATIC on ${platform}`,
    actionUrl: listingUrl || `/nft/marketplace?badge=${tokenId}`,
    metadata: {
      token_id: tokenId,
      listing_price: listingPrice,
      platform,
    },
  });
};

export const notifyRoyaltyEarned = async ({
  userId,
  tokenId,
  royaltyAmount,
  platform = 'OpenSea',
}: { userId: string; tokenId: string; royaltyAmount: number; platform?: string }) => {
  return createNotification({
    userId,
    type: 'royalty_earned',
    message: `Earned ${royaltyAmount.toFixed(4)} MATIC in royalties from Truth Badge #${tokenId}`,
    actionUrl: '/royalty-dashboard',
    metadata: {
      token_id: tokenId,
      royalty_amount: royaltyAmount,
      platform,
    },
  });
};
