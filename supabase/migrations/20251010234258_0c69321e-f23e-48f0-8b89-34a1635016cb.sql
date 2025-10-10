-- Create public_engagement table for tracking public content engagement
CREATE TABLE IF NOT EXISTS public.public_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('thread', 'article', 'organization', 'verification')),
  content_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'share', 'click', 'upvote')),
  platform text, -- For share events (twitter, linkedin, facebook, direct)
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_public_engagement_content ON public.public_engagement(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_public_engagement_event ON public.public_engagement(event_type);
CREATE INDEX IF NOT EXISTS idx_public_engagement_created ON public.public_engagement(created_at DESC);

-- Enable RLS
ALTER TABLE public.public_engagement ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert engagement events (public tracking)
CREATE POLICY "Anyone can track public engagement events"
ON public.public_engagement
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view engagement data
CREATE POLICY "Admins can view all engagement data"
ON public.public_engagement
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Create materialized view for engagement analytics (admins only)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.engagement_analytics AS
SELECT 
  content_type,
  content_id,
  COUNT(*) FILTER (WHERE event_type = 'view') as total_views,
  COUNT(*) FILTER (WHERE event_type = 'share') as total_shares,
  COUNT(*) FILTER (WHERE event_type = 'click') as total_clicks,
  COUNT(*) FILTER (WHERE event_type = 'upvote') as total_upvotes,
  COUNT(DISTINCT platform) FILTER (WHERE event_type = 'share') as unique_platforms,
  MAX(created_at) as last_engagement_at
FROM public.public_engagement
GROUP BY content_type, content_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_analytics_content 
ON public.engagement_analytics(content_type, content_id);

-- Function to refresh analytics (can be called via cron)
CREATE OR REPLACE FUNCTION public.refresh_engagement_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.engagement_analytics;
END;
$$;

COMMENT ON TABLE public.public_engagement IS 'Tracks public engagement on Lighthouse content for analytics and discovery optimization';
COMMENT ON MATERIALIZED VIEW public.engagement_analytics IS 'Aggregated engagement metrics for content performance analysis';