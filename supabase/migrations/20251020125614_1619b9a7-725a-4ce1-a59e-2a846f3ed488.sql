-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly price decay (runs every Monday at 2 AM UTC)
SELECT cron.schedule(
  'update-listing-prices-weekly',
  '0 2 * * 1', -- Every Monday at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/update-listing-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);