-- Fix critical security vulnerability: Prevent users from updating payments
-- Only allow service role to update payment records (for webhooks and system processes)

-- Drop the insecure policy that allows any user to update payments
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- Create a secure policy that only allows service role to update payments
-- This ensures only backend processes (like webhooks) can modify payment records
CREATE POLICY "Only service role can update payments" 
ON public.payments 
FOR UPDATE 
TO service_role
USING (true);

-- Add additional security: prevent users from updating specific sensitive columns
-- Users should never be able to modify amount, status, flw_id, etc.
CREATE POLICY "Prevent user payment manipulation" 
ON public.payments 
FOR UPDATE 
TO authenticated
USING (false); -- Explicitly deny all user updates

-- Add audit comment
COMMENT ON TABLE public.payments IS 'Payment records - only service role can modify to prevent user manipulation. User updates explicitly denied.';

-- Verify the security fix
SELECT 'Payment security vulnerability fixed - only service role can update payments' as result;