-- Fix the dependency issue by dropping policy first, then function

-- Drop the admin policy that depends on the function
DROP POLICY IF EXISTS "Admins can view payment logs" ON public.payment_logs;

-- Drop the security definer function
DROP FUNCTION IF EXISTS public.can_access_payment_logs();

-- Recreate the admin policy using direct role check (simpler and more secure)
CREATE POLICY "Admins can view payment logs" 
ON public.payment_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Update comments
COMMENT ON TABLE public.payment_logs IS 'Payment processing logs. Direct access restricted to service role and administrators via RLS policies. Use payment_logs_summary view for safe non-sensitive access.';