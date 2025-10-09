-- Schedule weekly trust brief generation (Sundays at 8 AM UTC)
SELECT cron.schedule(
  'weekly-trust-brief-generation',
  '0 8 * * 0', -- 8 AM UTC every Sunday
  $$
  SELECT
    net.http_post(
      url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/generate-trust-brief',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Create admin analytics view for revenue tracking
CREATE OR REPLACE VIEW public.admin_revenue_stats AS
SELECT
  DATE_TRUNC('month', p.created_at) as month,
  p.plan,
  COUNT(*) as payment_count,
  SUM(p.amount) as total_revenue,
  AVG(p.amount) as avg_transaction
FROM public.payments p
WHERE p.status = 'successful'
GROUP BY DATE_TRUNC('month', p.created_at), p.plan
ORDER BY month DESC;

-- Create API usage stats view
CREATE OR REPLACE VIEW public.admin_api_usage_stats AS
SELECT
  ak.user_id,
  ak.name as api_key_name,
  COUNT(aul.id) as total_requests,
  COUNT(CASE WHEN aul.status_code = 200 THEN 1 END) as successful_requests,
  COUNT(CASE WHEN aul.status_code >= 400 THEN 1 END) as failed_requests,
  MAX(aul.created_at) as last_used,
  COUNT(DISTINCT DATE(aul.created_at)) as active_days
FROM public.api_keys ak
LEFT JOIN public.api_usage_logs aul ON aul.api_key_hash = ak.key_hash
GROUP BY ak.user_id, ak.name, ak.id;

-- Create most requested analytics view
CREATE OR REPLACE VIEW public.admin_popular_analytics AS
SELECT
  endpoint,
  COUNT(*) as request_count,
  AVG(CASE WHEN (metadata->>'processing_time_ms')::int > 0 
      THEN (metadata->>'processing_time_ms')::int 
      END) as avg_response_time_ms,
  COUNT(CASE WHEN status_code = 200 THEN 1 END) as success_count,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM public.api_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY endpoint
ORDER BY request_count DESC;

-- Grant select permissions to admins
GRANT SELECT ON public.admin_revenue_stats TO authenticated;
GRANT SELECT ON public.admin_api_usage_stats TO authenticated;
GRANT SELECT ON public.admin_popular_analytics TO authenticated;