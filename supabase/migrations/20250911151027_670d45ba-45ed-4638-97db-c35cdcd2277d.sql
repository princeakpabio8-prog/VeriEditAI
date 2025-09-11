-- Remove the security definer function that's causing the linter warning
-- The function was used in a view context which triggered the security warning

-- Drop the function since we don't need it for the current secure setup
DROP FUNCTION IF EXISTS public.can_access_payment_logs();

-- The current RLS policies on payment_logs are sufficient:
-- 1. Service role can manage all payment logs (for webhooks/system processes)
-- 2. Admins can view payment logs using the existing admin check in RLS

-- Update the comment to reflect the final security model
COMMENT ON TABLE public.payment_logs IS 'Payment processing logs. Direct access restricted to service role and administrators via RLS policies. Use payment_logs_summary view for safe non-sensitive access.';

-- Verify our current policies are still in place and working correctly
-- (This is just a verification query, not changing anything)
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'payment_logs';