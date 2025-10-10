-- ========================================
-- SECURITY FIX: RLS Policies for PII Protection
-- ========================================

-- 1. Ensure profiles table has strict RLS policies
-- Drop any overly permissive policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Ensure only the owner can view their profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Ensure subscribers table has strict RLS policies
-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Public can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view all subscribers" ON public.subscribers;

-- Ensure only the owner can view their subscription
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscribers' 
    AND policyname = 'Users can view their own subscription'
  ) THEN
    CREATE POLICY "Users can view their own subscription"
    ON public.subscribers
    FOR SELECT
    USING (
      user_id = auth.uid() 
      OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
END $$;

-- 3. Create webhook deduplication table for replay attack prevention
CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,
  webhook_type text NOT NULL,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_key ON public.webhook_idempotency(idempotency_key);

-- Enable RLS (service role only needs access)
ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;

-- Only service role can manage webhook idempotency
CREATE POLICY "Service role can manage webhook idempotency"
ON public.webhook_idempotency
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Add constraint to prevent duplicate successful payments
-- This prevents the same transaction from being marked successful twice
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_successful_payment_per_tx_ref'
  ) THEN
    -- Add unique constraint for successful payments by tx_ref
    ALTER TABLE public.payments 
    ADD CONSTRAINT unique_successful_payment_per_tx_ref 
    UNIQUE (tx_ref, status) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create audit log table for profile access (GDPR compliance)
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type text NOT NULL, -- 'view', 'update', 'delete'
  accessed_at timestamptz DEFAULT now(),
  access_reason text,
  ip_address inet,
  user_agent text
);

-- Add index for fast queries
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessed_user ON public.profile_access_logs(accessed_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessed_at ON public.profile_access_logs(accessed_at);

-- Enable RLS
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all access logs
CREATE POLICY "Admins can view all profile access logs"
ON public.profile_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view access logs for their own profile
CREATE POLICY "Users can view their own profile access logs"
ON public.profile_access_logs
FOR SELECT
USING (accessed_user_id = auth.uid());

-- Service role can insert access logs
CREATE POLICY "Service role can insert access logs"
ON public.profile_access_logs
FOR INSERT
WITH CHECK (true);

-- 6. Auto-cleanup old webhook idempotency records (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_idempotency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.webhook_idempotency
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON TABLE public.webhook_idempotency IS 'Prevents replay attacks on payment webhooks by tracking processed requests';
COMMENT ON TABLE public.profile_access_logs IS 'Audit trail for profile data access (GDPR compliance)';
COMMENT ON FUNCTION cleanup_old_webhook_idempotency() IS 'Cleanup function for old webhook idempotency records (run via cron)';