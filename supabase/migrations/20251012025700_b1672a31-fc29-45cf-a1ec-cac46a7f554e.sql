-- Create storage bucket for thread and comment images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thread-images', 'thread-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add image_urls array to room_threads
ALTER TABLE public.room_threads
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add image_urls array to thread_comments
ALTER TABLE public.thread_comments
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add metadata for image info (dimensions, file size, etc.)
ALTER TABLE public.room_threads
ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.thread_comments
ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '[]'::jsonb;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload thread images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thread-images');

-- Allow everyone to view images (public bucket)
CREATE POLICY "Anyone can view thread images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thread-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own thread images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thread-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);