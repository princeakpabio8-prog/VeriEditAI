-- Add public read access to nft_badges so marketplace is visible to everyone
CREATE POLICY "Anyone can view all NFT badges"
ON public.nft_badges
FOR SELECT
USING (true);

-- Add public read access to nft_collection_stats
-- (Already has policy, but ensuring it's correct)

-- Update comment for clarity
COMMENT ON TABLE public.nft_badges IS 'NFT Truth Badges minted on blockchain - publicly viewable for marketplace';