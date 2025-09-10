-- SECURITY FIX: Remove overly permissive subscription policies
-- These policies allowed any user to create/modify any subscription data

-- Remove the dangerous policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Also remove the duplicate policies that may conflict
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

-- Keep only the secure SELECT policy 
-- (select_own_subscription allows viewing own data via user_id or email)

-- CREATE SECURE POLICIES:

-- 1. Users can only INSERT their own subscription records
-- This prevents users from creating subscriptions for other users
CREATE POLICY "secure_insert_own_subscription" ON public.subscribers
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email() = email
);

-- 2. Users can only UPDATE their own subscription records  
-- This prevents users from modifying other users' subscription data
CREATE POLICY "secure_update_own_subscription" ON public.subscribers
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email() = email
);

-- 3. Service role bypass policy for edge functions
-- Edge functions using service role key will bypass all RLS policies
-- This ensures our Stripe webhook/edge functions can still operate

-- Add index for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);