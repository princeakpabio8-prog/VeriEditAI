-- Fix security vulnerability in subscribers table
-- Make user_id NOT NULL to prevent bypass attacks
-- Strengthen RLS policies to ensure auth.uid() validation

-- First, update any existing records with NULL user_id (if any exist)
-- This should not happen in practice, but ensures data integrity
UPDATE public.subscribers 
SET user_id = (
  SELECT id FROM auth.users WHERE email = subscribers.email LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL to prevent null bypass attacks
ALTER TABLE public.subscribers 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscribers;

-- Create strengthened RLS policies with proper null handling
CREATE POLICY "Users can view only their own subscription" 
ON public.subscribers 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can insert only their own subscription" 
ON public.subscribers 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id 
  AND auth.email() = email
);

CREATE POLICY "Users can update only their own subscription" 
ON public.subscribers 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id 
  AND auth.email() = email
);

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscribers 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update all subscriptions" 
ON public.subscribers 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add a comment explaining the security measures
COMMENT ON TABLE public.subscribers IS 'Stores user subscription data. RLS policies enforce strict user_id and email validation to prevent unauthorized access to customer data.';