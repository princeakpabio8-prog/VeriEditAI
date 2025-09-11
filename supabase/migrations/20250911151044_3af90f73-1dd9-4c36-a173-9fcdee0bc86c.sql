-- Fix critical security vulnerability in payment_logs table
-- Remove overly permissive policy and implement secure access controls

-- First, drop the existing insecure policy
DROP POLICY IF EXISTS "System can manage payment logs" ON public.payment_logs;

-- Create secure policies that restrict access appropriately

-- 1. Allow service role (system processes) to manage payment logs
-- This enables webhook handlers and payment processing systems to work
CREATE POLICY "Service role can manage payment logs" 
ON public.payment_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Allow administrators to view payment logs for debugging/monitoring
CREATE POLICY "Admins can view payment logs" 
ON public.payment_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- 3. Create a security definer function for safe payment log access by admins
CREATE OR REPLACE FUNCTION public.can_access_payment_logs()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$$;

-- 4. Enhanced admin policy using the security definer function
DROP POLICY IF EXISTS "Admins can view payment logs" ON public.payment_logs;

CREATE POLICY "Admins can view payment logs" 
ON public.payment_logs
FOR SELECT 
USING (public.can_access_payment_logs());

-- 5. Create a view for safer payment log access (optional, removes sensitive data)
CREATE OR REPLACE VIEW public.payment_logs_safe AS
SELECT 
  id,
  event_type,
  status,
  created_at,
  -- Mask sensitive data
  CASE 
    WHEN public.can_access_payment_logs() THEN tx_ref
    ELSE 'HIDDEN'
  END as tx_ref,
  CASE 
    WHEN public.can_access_payment_logs() THEN error_message
    ELSE 'HIDDEN'
  END as error_message,
  -- Remove payload and signature completely from view
  NULL::jsonb as payload_summary
FROM public.payment_logs;

-- Grant appropriate permissions
GRANT SELECT ON public.payment_logs_safe TO authenticated;

-- Add comment explaining the security model
COMMENT ON TABLE public.payment_logs IS 'Payment processing logs. Access restricted to service role and administrators only for security.';
COMMENT ON FUNCTION public.can_access_payment_logs() IS 'Security definer function to check if current user can access payment logs (admins only).';
COMMENT ON VIEW public.payment_logs_safe IS 'Safe view of payment logs with sensitive data masked for non-admin users.';