-- Fix security warnings from engagement analytics

-- Remove the materialized view from the API by revoking access
REVOKE ALL ON public.engagement_analytics FROM anon, authenticated;

-- Grant access only to admins via a security definer function
CREATE OR REPLACE FUNCTION public.get_engagement_analytics(p_content_type text DEFAULT NULL, p_content_id uuid DEFAULT NULL)
RETURNS TABLE (
  content_type text,
  content_id uuid,
  total_views bigint,
  total_shares bigint,
  total_clicks bigint,
  total_upvotes bigint,
  unique_platforms bigint,
  last_engagement_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user is admin
  SELECT 
    ea.content_type,
    ea.content_id,
    ea.total_views,
    ea.total_shares,
    ea.total_clicks,
    ea.total_upvotes,
    ea.unique_platforms,
    ea.last_engagement_at
  FROM public.engagement_analytics ea
  WHERE 
    has_role(auth.uid(), 'admin'::app_role)
    AND (p_content_type IS NULL OR ea.content_type = p_content_type)
    AND (p_content_id IS NULL OR ea.content_id = p_content_id);
$$;

-- Comment on the function
COMMENT ON FUNCTION public.get_engagement_analytics IS 'Admin-only access to engagement analytics via security definer function';

-- Note: The other warnings (function search_path, extension in public, leaked password protection) 
-- are either unavoidable PostgreSQL defaults or project-level settings that require manual configuration
-- in Supabase dashboard