-- Create news_feed table for The Lighthouse Feed
CREATE TABLE IF NOT EXISTS public.news_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  summary TEXT,
  full_content TEXT,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  category TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_news_feed_published ON public.news_feed(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_feed_source ON public.news_feed(source);
CREATE INDEX IF NOT EXISTS idx_news_feed_category ON public.news_feed(category);
CREATE INDEX IF NOT EXISTS idx_news_feed_verified ON public.news_feed(is_verified);
CREATE INDEX IF NOT EXISTS idx_news_feed_trust_score ON public.news_feed(trust_score);
CREATE INDEX IF NOT EXISTS idx_news_feed_link ON public.news_feed(link);

-- Enable Row Level Security
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view all news articles (public access)
CREATE POLICY "Anyone can view news articles"
  ON public.news_feed
  FOR SELECT
  USING (true);

-- RLS Policy: Only admins can insert news articles
CREATE POLICY "Admins can insert news articles"
  ON public.news_feed
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Only admins can update news articles
CREATE POLICY "Admins can update news articles"
  ON public.news_feed
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Only admins can delete news articles
CREATE POLICY "Admins can delete news articles"
  ON public.news_feed
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_news_feed_updated_at
  BEFORE UPDATE ON public.news_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table for documentation
COMMENT ON TABLE public.news_feed IS 'The Lighthouse Feed: RSS-based news aggregation with verification integration';