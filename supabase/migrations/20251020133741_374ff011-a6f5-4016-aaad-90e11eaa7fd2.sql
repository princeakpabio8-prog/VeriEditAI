-- Create storage bucket for NFT badge images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('nft-badge-images', 'nft-badge-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view NFT badge images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage NFT badge images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload NFT badge images" ON storage.objects;

-- Create RLS policies for nft-badge-images bucket
CREATE POLICY "Public can view NFT badge images"
ON storage.objects FOR SELECT
USING (bucket_id = 'nft-badge-images');

CREATE POLICY "Service role can manage NFT badge images"
ON storage.objects FOR ALL
USING (bucket_id = 'nft-badge-images')
WITH CHECK (bucket_id = 'nft-badge-images');

CREATE POLICY "Authenticated users can upload NFT badge images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nft-badge-images' AND auth.role() = 'authenticated');