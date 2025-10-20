-- Add OpenSea tracking columns to nft_badges table
ALTER TABLE nft_badges 
ADD COLUMN IF NOT EXISTS opensea_last_refresh TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opensea_refresh_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opensea_image_confirmed BOOLEAN DEFAULT FALSE;