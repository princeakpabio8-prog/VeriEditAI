-- Reset all active trial licenses for the new month
UPDATE licenses 
SET current_usage = 0, 
    last_reset_at = now(), 
    updated_at = now() 
WHERE license_type = 'trial' 
  AND status = 'active';

-- Set up cron job to reset licenses on the 1st of each month at midnight UTC
-- First ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists
SELECT cron.unschedule('monthly-license-reset') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'monthly-license-reset'
);

-- Schedule monthly license reset on the 1st of each month at 00:05 UTC
SELECT cron.schedule(
  'monthly-license-reset',
  '5 0 1 * *',
  $$
  UPDATE licenses 
  SET current_usage = 0, 
      last_reset_at = now(), 
      updated_at = now() 
  WHERE license_type = 'trial' 
    AND status = 'active';
  $$
);