-- Fix subscribers table RLS policies for better security
-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "secure_insert_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "secure_update_own_subscription" ON public.subscribers;

-- Create stricter SELECT policy: users can only view their own subscription
CREATE POLICY "Users can view only their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add admin SELECT policy for administrative access
CREATE POLICY "Admins can view all subscriptions"
ON public.subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Secure INSERT policy: users can only insert their own subscription
CREATE POLICY "Users can insert only their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email() = email
);

-- Secure UPDATE policy: users can only update their own subscription
CREATE POLICY "Users can update only their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email() = email
);

-- Add admin UPDATE policy for administrative access
CREATE POLICY "Admins can update all subscriptions"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Verify RLS is enabled (should already be enabled, but this ensures it)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;