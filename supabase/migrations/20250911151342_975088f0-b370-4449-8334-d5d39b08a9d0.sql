-- Complete the security fix for payment_logs
-- Replace the problematic view with a safer alternative

-- Drop the existing view completely first
DROP VIEW IF EXISTS public.payment_logs_safe CASCADE;

-- Create a new safer view without security definer
CREATE VIEW public.payment_logs_summary AS
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

-- Create a function to get payment stats for admins (safe version)
CREATE OR REPLACE FUNCTION public.get_payment_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  -- Only return data if user is admin, otherwise return empty stats
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role) THEN
      json_build_object(
        'total_payments', COUNT(*),
        'successful_payments', COUNT(*) FILTER (WHERE status = 'success'),
        'failed_payments', COUNT(*) FILTER (WHERE status = 'failed'),
        'pending_payments', COUNT(*) FILTER (WHERE status = 'pending'),
        'last_updated', NOW()
      )
    ELSE
      json_build_object(
        'error', 'Unauthorized - Admin access required',
        'total_payments', 0,
        'successful_payments', 0,
        'failed_payments', 0,
        'pending_payments', 0
      )
  END
  FROM public.payment_logs;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_payment_stats() TO authenticated;

-- Add helpful comments
COMMENT ON VIEW public.payment_logs_summary IS 'Safe summary view of payment logs showing only basic status information to authenticated users.';
COMMENT ON FUNCTION public.get_payment_stats() IS 'Returns payment statistics in JSON format. Only admins see real data, others get unauthorized message.';

-- Log the completion of security fix
SELECT 'Payment logs security fix completed successfully' as status;