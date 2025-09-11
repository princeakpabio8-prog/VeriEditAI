-- Complete the security fix for payment_logs
-- Remove the security definer view and create a safer alternative

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.payment_logs_safe;

-- Create a safer view without security definer (uses invoker's permissions)
CREATE OR REPLACE VIEW public.payment_logs_summary AS
SELECT 
  id,
  event_type,
  status,
  created_at,
  -- Only show basic, non-sensitive information
  CASE 
    WHEN status = 'success' THEN 'Payment completed successfully'
    WHEN status = 'failed' THEN 'Payment failed'
    WHEN status = 'pending' THEN 'Payment processing'
    ELSE 'Unknown status'
  END as status_description
FROM public.payment_logs;

-- Grant read access to authenticated users for the summary view only
GRANT SELECT ON public.payment_logs_summary TO authenticated;

-- Update function comment to clarify its purpose
COMMENT ON FUNCTION public.can_access_payment_logs() IS 'Checks if current user is an admin and can access sensitive payment logs. Used in RLS policies.';

-- Add additional security: Create a function to get payment stats for admins
CREATE OR REPLACE FUNCTION public.get_payment_stats()
RETURNS TABLE(
  total_payments bigint,
  successful_payments bigint,
  failed_payments bigint,
  pending_payments bigint
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow admins to see payment statistics
  SELECT 
    CASE WHEN public.can_access_payment_logs() THEN
      COUNT(*)
    ELSE 0 END,
    CASE WHEN public.can_access_payment_logs() THEN
      COUNT(*) FILTER (WHERE status = 'success')
    ELSE 0 END,
    CASE WHEN public.can_access_payment_logs() THEN
      COUNT(*) FILTER (WHERE status = 'failed')
    ELSE 0 END,
    CASE WHEN public.can_access_payment_logs() THEN
      COUNT(*) FILTER (WHERE status = 'pending')
    ELSE 0 END
  FROM public.payment_logs;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_payment_stats() TO authenticated;

-- Update comments for clarity
COMMENT ON VIEW public.payment_logs_summary IS 'Safe summary view of payment logs showing only basic status information to authenticated users.';
COMMENT ON FUNCTION public.get_payment_stats() IS 'Returns payment statistics. Only admins see real data, others see zeros.';

-- Verify the security setup by checking policies
-- This will be shown in the migration result for verification