-- Add image_url column to news_feed table
ALTER TABLE public.news_feed 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_news_feed_image_url ON public.news_feed(image_url) 
WHERE image_url IS NOT NULL;