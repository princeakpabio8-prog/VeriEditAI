-- Add video_url column to news_feed table
ALTER TABLE public.news_feed 
ADD COLUMN IF NOT EXISTS video_url TEXT;