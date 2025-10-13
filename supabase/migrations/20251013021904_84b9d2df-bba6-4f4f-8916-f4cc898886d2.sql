-- Add analytics columns to activity_stream table for SEO tracking
ALTER TABLE public.activity_stream 
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Add index for public activities
CREATE INDEX IF NOT EXISTS idx_activity_stream_public 
ON public.activity_stream(is_public, created_at DESC) 
WHERE is_public = true;

-- Add index for activity analytics
CREATE INDEX IF NOT EXISTS idx_activity_stream_engagement 
ON public.activity_stream(view_count DESC, share_count DESC, click_count DESC);

COMMENT ON COLUMN public.activity_stream.view_count IS 'Number of times this activity was viewed';
COMMENT ON COLUMN public.activity_stream.share_count IS 'Number of times this activity was shared on social media';
COMMENT ON COLUMN public.activity_stream.click_count IS 'Number of clicks on activity links';
COMMENT ON COLUMN public.activity_stream.is_public IS 'Whether this activity should be publicly visible and SEO indexed';