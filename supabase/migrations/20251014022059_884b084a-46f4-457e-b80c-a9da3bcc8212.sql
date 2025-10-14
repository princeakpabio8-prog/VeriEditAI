-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule Reddit monitoring (runs every 15 minutes)
SELECT cron.schedule(
  'monitor-reddit-viral',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/monitor-reddit',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Schedule virality calculation (runs every 10 minutes)
SELECT cron.schedule(
  'track-engagement-velocity',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/calculate-virality',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);