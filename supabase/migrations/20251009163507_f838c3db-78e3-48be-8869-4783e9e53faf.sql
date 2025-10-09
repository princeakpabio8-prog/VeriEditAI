-- Fix Security Definer Views
-- Drop and recreate views without SECURITY DEFINER to respect querying user's RLS policies

-- Drop existing security definer views
DROP VIEW IF EXISTS public.admin_popular_analytics;
DROP VIEW IF EXISTS public.admin_api_usage_stats;
DROP VIEW IF EXISTS public.admin_revenue_stats;
DROP VIEW IF EXISTS public.payment_logs_summary;

-- Recreate admin_popular_analytics as regular view (SECURITY INVOKER by default)
CREATE VIEW public.admin_popular_analytics AS
SELECT 
  endpoint,
  COUNT(*) as request_count,
  COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 400) as success_count,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
  AVG(CAST(metadata->>'response_time_ms' AS numeric)) as avg_response_time_ms
FROM public.api_usage_logs
GROUP BY endpoint
ORDER BY request_count DESC;

-- Recreate admin_api_usage_stats as regular view
CREATE VIEW public.admin_api_usage_stats AS
SELECT 
  ak.user_id,
  ak.name as api_key_name,
  COUNT(aul.id) as total_requests,
  COUNT(aul.id) FILTER (WHERE aul.status_code >= 200 AND aul.status_code < 400) as successful_requests,
  COUNT(aul.id) FILTER (WHERE aul.status_code >= 400) as failed_requests,
  MAX(ak.last_used_at) as last_used,
  COUNT(DISTINCT DATE(aul.created_at)) as active_days
FROM public.api_keys ak
LEFT JOIN public.api_usage_logs aul ON ak.key_hash = aul.api_key_hash
GROUP BY ak.user_id, ak.name;

-- Recreate admin_revenue_stats as regular view
CREATE VIEW public.admin_revenue_stats AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  plan,
  COUNT(*) as payment_count,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_transaction
FROM public.payments
WHERE status = 'successful'
GROUP BY DATE_TRUNC('month', created_at), plan
ORDER BY month DESC, plan;

-- Recreate payment_logs_summary as regular view
CREATE VIEW public.payment_logs_summary AS
SELECT 
  id,
  created_at,
  event_type,
  status,
  CASE 
    WHEN status = 'success' THEN 'Payment processed successfully'
    WHEN status = 'failed' THEN COALESCE(error_message, 'Payment failed')
    WHEN status = 'pending' THEN 'Payment pending processing'
    ELSE 'Unknown status'
  END as status_description
FROM public.payment_logs
ORDER BY created_at DESC;

-- Grant SELECT permissions to authenticated users for these views
GRANT SELECT ON public.admin_popular_analytics TO authenticated;
GRANT SELECT ON public.admin_api_usage_stats TO authenticated;
GRANT SELECT ON public.admin_revenue_stats TO authenticated;
GRANT SELECT ON public.payment_logs_summary TO authenticated;

-- Add comments explaining the security model
COMMENT ON VIEW public.admin_popular_analytics IS 'API analytics view. Access controlled by RLS policies on underlying api_usage_logs table.';
COMMENT ON VIEW public.admin_api_usage_stats IS 'API key usage statistics. Access controlled by RLS policies on underlying api_keys and api_usage_logs tables.';
COMMENT ON VIEW public.admin_revenue_stats IS 'Revenue statistics. Access controlled by RLS policies on underlying payments table.';
COMMENT ON VIEW public.payment_logs_summary IS 'Payment logs summary. Access controlled by RLS policies on underlying payment_logs table.';