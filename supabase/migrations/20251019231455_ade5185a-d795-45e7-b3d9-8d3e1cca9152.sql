-- Create storage bucket for NFT badge images
INSERT INTO storage.buckets (id, name, public)
VALUES ('nft-badge-images', 'nft-badge-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to NFT badge images
CREATE POLICY "Public can view NFT badge images"
ON storage.objects FOR SELECT
USING (bucket_id = 'nft-badge-images');

-- Allow service role to upload NFT badge images
CREATE POLICY "Service role can upload NFT badge images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nft-badge-images' AND auth.role() = 'service_role');