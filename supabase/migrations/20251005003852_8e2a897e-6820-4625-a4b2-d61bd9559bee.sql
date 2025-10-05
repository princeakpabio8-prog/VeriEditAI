-- Fix content_type constraint to allow 'image'
ALTER TABLE public.verifications 
DROP CONSTRAINT IF EXISTS verifications_content_type_check;

ALTER TABLE public.verifications 
ADD CONSTRAINT verifications_content_type_check 
CHECK (content_type = ANY (ARRAY['text'::text, 'url'::text, 'file'::text, 'image'::text]));

-- Add full_content column to sources table for storing complete Tavily results
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS full_content text;