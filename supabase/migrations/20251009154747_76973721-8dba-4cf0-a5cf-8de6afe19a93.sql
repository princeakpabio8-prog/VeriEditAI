-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create aggregation logs table for monitoring
CREATE TABLE public.aggregation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on aggregation_logs
ALTER TABLE public.aggregation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view aggregation logs
CREATE POLICY "Admins can view aggregation logs"
  ON public.aggregation_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert logs
CREATE POLICY "Service role can insert aggregation logs"
  ON public.aggregation_logs
  FOR INSERT
  WITH CHECK (true);

-- Schedule daily trust data aggregation at 2:00 AM UTC
SELECT cron.schedule(
  'daily-trust-aggregation',
  '0 2 * * *', -- 2 AM UTC every day
  $$
  SELECT
    net.http_post(
      url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/aggregate-trust-data',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Data retention: Delete old verification records (365+ days)
SELECT cron.schedule(
  'cleanup-old-verifications',
  '0 3 * * 0', -- 3 AM UTC every Sunday
  $$
  DELETE FROM public.verifications
  WHERE created_at < now() - interval '365 days';
  $$
);

-- Create index for efficient log queries
CREATE INDEX idx_aggregation_logs_created_at ON public.aggregation_logs(created_at DESC);
CREATE INDEX idx_aggregation_logs_status ON public.aggregation_logs(execution_status);