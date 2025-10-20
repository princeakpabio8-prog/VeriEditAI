-- Add image_url column to viral_claims table
ALTER TABLE public.viral_claims 
ADD COLUMN IF NOT EXISTS image_url text;