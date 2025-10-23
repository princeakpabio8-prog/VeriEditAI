-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the calculate-virality function to run every 2 hours
SELECT cron.schedule(
  'refresh-viral-claims-every-2-hours',
  '0 */2 * * *', -- Every 2 hours at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://jivuvrybwznhykpgdkob.supabase.co/functions/v1/calculate-virality',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdnV2cnlid3puaHlrcGdka29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDE4MzcsImV4cCI6MjA1MTQxNzgzN30.efOLSELxiWLr79_GW6oC6VbS91oUqr15bpEqKaVEy6I"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);