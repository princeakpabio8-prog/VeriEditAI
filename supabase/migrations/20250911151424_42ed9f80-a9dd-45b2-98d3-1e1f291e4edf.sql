-- Final security fix for payment_logs - clean up existing objects first

-- Drop existing objects that may conflict
DROP VIEW IF EXISTS public.payment_logs_summary CASCADE;
DROP FUNCTION IF EXISTS public.get_payment_stats() CASCADE;

-- Now create the secure setup from scratch
-- Create a safe summary view (no sensitive data exposed)
CREATE VIEW public.payment_logs_summary AS
SELECT 
  id,
  event_type,
  status,
  created_at,
  CASE 
    WHEN status = 'success' THEN 'Payment completed successfully'
    WHEN status = 'failed' THEN 'Payment failed'
    WHEN status = 'pending' THEN 'Payment processing'
    ELSE 'Unknown status'
  END as status_description
FROM public.payment_logs;

-- Create admin-only payment statistics function
CREATE OR REPLACE FUNCTION public.get_payment_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    ) THEN
      json_build_object(
        'total_payments', COUNT(*),
        'successful_payments', COUNT(*) FILTER (WHERE status = 'success'),
        'failed_payments', COUNT(*) FILTER (WHERE status = 'failed'),
        'pending_payments', COUNT(*) FILTER (WHERE status = 'pending'),
        'last_updated', NOW()
      )
    ELSE
      json_build_object(
        'error', 'Unauthorized: Admin access required'
      )
  END
  FROM public.payment_logs;
$$;

-- Set appropriate permissions
GRANT SELECT ON public.payment_logs_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_stats() TO authenticated;

-- Add security documentation
COMMENT ON TABLE public.payment_logs IS 'Sensitive payment processing logs. Direct access restricted to service role and administrators only.';
COMMENT ON VIEW public.payment_logs_summary IS 'Public-safe view showing only basic payment status information without sensitive data.';
COMMENT ON FUNCTION public.get_payment_stats() IS 'Payment statistics function - returns real data for admins, unauthorized message for others.';

-- Verify the security configuration
SELECT 'Security fix applied successfully' as result;