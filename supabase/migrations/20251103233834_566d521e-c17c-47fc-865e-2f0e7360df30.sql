-- Enable pg_cron and pg_net extensions for automated scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule feed refresh every 12 hours at 6 AM and 6 PM UTC
SELECT cron.schedule(
  'auto-refresh-viral-feeds',
  '0 6,18 * * *',
  $$
  SELECT net.http_post(
    url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/fetch-rss-news',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Trigger virality calculation 30 minutes after feed refresh
SELECT cron.schedule(
  'auto-calculate-virality',
  '30 6,18 * * *',
  $$
  SELECT net.http_post(
    url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/calculate-virality',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Monitor YouTube every 6 hours
SELECT cron.schedule(
  'auto-monitor-youtube',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/monitor-youtube',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Monitor Reddit every 8 hours
SELECT cron.schedule(
  'auto-monitor-reddit',
  '0 */8 * * *',
  $$
  SELECT net.http_post(
    url:='https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/monitor-reddit',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);