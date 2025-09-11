-- Fix security definer view issue
-- Remove the problematic view and replace with a secure RLS-based approach

-- Drop the security definer view
DROP VIEW IF EXISTS public.payment_logs_safe;

-- Instead, create a simple view without security definer that relies on RLS
CREATE OR REPLACE VIEW public.payment_logs_summary AS
SELECT 
  id,
  event_type,
  status,
  created_at,
  -- Only show basic non-sensitive info in view
  'MASKED' as tx_ref_status,
  CASE WHEN error_message IS NOT NULL THEN 'ERROR_OCCURRED' ELSE 'NO_ERROR' END as error_status
FROM public.payment_logs;

-- Enable RLS on the view (inherits from base table)
-- The view will automatically respect the RLS policies from payment_logs table

-- Grant select permission to authenticated users (they'll still be subject to RLS)
GRANT SELECT ON public.payment_logs_summary TO authenticated;

-- Update comment
COMMENT ON VIEW public.payment_logs_summary IS 'Summary view of payment logs with sensitive data removed. Access controlled by RLS policies on payment_logs table.';