-- Revoke all public access from admin analytics views
REVOKE ALL ON public.admin_popular_analytics FROM PUBLIC;
REVOKE ALL ON public.admin_api_usage_stats FROM PUBLIC;
REVOKE ALL ON public.admin_revenue_stats FROM PUBLIC;
REVOKE ALL ON public.payment_logs_summary FROM PUBLIC;

-- Revoke all access from anon role
REVOKE ALL ON public.admin_popular_analytics FROM anon;
REVOKE ALL ON public.admin_api_usage_stats FROM anon;
REVOKE ALL ON public.admin_revenue_stats FROM anon;
REVOKE ALL ON public.payment_logs_summary FROM anon;

-- Revoke all access from authenticated role by default
REVOKE ALL ON public.admin_popular_analytics FROM authenticated;
REVOKE ALL ON public.admin_api_usage_stats FROM authenticated;
REVOKE ALL ON public.admin_revenue_stats FROM authenticated;
REVOKE ALL ON public.payment_logs_summary FROM authenticated;

-- Grant SELECT only to postgres role (for admin functions to use)
GRANT SELECT ON public.admin_popular_analytics TO postgres;
GRANT SELECT ON public.admin_api_usage_stats TO postgres;
GRANT SELECT ON public.admin_revenue_stats TO postgres;
GRANT SELECT ON public.payment_logs_summary TO postgres;

-- Create security definer functions that check admin role before allowing access

-- Function to get popular analytics (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_popular_analytics()
RETURNS TABLE (
  endpoint text,
  request_count bigint,
  success_count bigint,
  error_count bigint,
  avg_response_time_ms numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return the analytics data
  RETURN QUERY SELECT * FROM public.admin_popular_analytics;
END;
$$;

-- Function to get API usage stats (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_api_usage_stats()
RETURNS TABLE (
  user_id uuid,
  api_key_name text,
  total_requests bigint,
  successful_requests bigint,
  failed_requests bigint,
  last_used timestamp with time zone,
  active_days bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return the analytics data
  RETURN QUERY SELECT * FROM public.admin_api_usage_stats;
END;
$$;

-- Function to get revenue stats (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_revenue_stats()
RETURNS TABLE (
  month timestamp with time zone,
  plan plan_type,
  payment_count bigint,
  total_revenue numeric,
  avg_transaction numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return the analytics data
  RETURN QUERY SELECT * FROM public.admin_revenue_stats;
END;
$$;

-- Function to get payment logs summary (admin only)
CREATE OR REPLACE FUNCTION public.get_payment_logs_summary()
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  event_type text,
  status text,
  status_description text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return the analytics data
  RETURN QUERY SELECT * FROM public.payment_logs_summary;
END;
$$;