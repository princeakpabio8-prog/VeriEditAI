-- Create a storage bucket for NFT metadata
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nft-metadata', 'nft-metadata', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Public can view NFT metadata" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'nft-metadata');

CREATE POLICY "Service role can upload NFT metadata" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'nft-metadata' AND auth.role() = 'service_role');