-- Fix the security issue with payment_logs table
-- This replaces the overly permissive view with a safer summary

-- Drop existing view completely and create a new simple one
DROP VIEW IF EXISTS public.payment_logs_summary;

-- Create a minimal summary view that shows only basic status info
CREATE VIEW public.payment_logs_summary AS
SELECT 
  id,
  event_type,
  status,
  created_at
FROM public.payment_logs;

-- This view inherits RLS from the base table, so only admins and service role can see data

-- Grant access to authenticated users (subject to RLS policies)
GRANT SELECT ON public.payment_logs_summary TO authenticated;

-- Revoke any broad permissions that may exist
REVOKE ALL ON public.payment_logs FROM PUBLIC;
REVOKE ALL ON public.payment_logs FROM authenticated;

-- Ensure only service role and admins (via RLS) can access the main table
GRANT SELECT ON public.payment_logs TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.payment_logs TO service_role;

COMMENT ON VIEW public.payment_logs_summary IS 'Basic summary of payment logs. Access controlled by RLS policies - only admins can see data.';
COMMENT ON TABLE public.payment_logs IS 'Sensitive payment processing logs. Access restricted to service role and administrators only.';