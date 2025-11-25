-- Enable realtime for nft_badges table
ALTER TABLE nft_badges REPLICA IDENTITY FULL;

-- Add nft_badges to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE nft_badges;