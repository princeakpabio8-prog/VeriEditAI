-- Create payments table to track Flutterwave transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_ref TEXT UNIQUE NOT NULL,
  flw_ref TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('pro', 'enterprise')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  payment_method TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update licenses table to include payment reference
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id);

-- Create function to upgrade user subscription
CREATE OR REPLACE FUNCTION public.upgrade_user_subscription(
  user_uuid UUID,
  plan TEXT,
  payment_uuid UUID,
  expires_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  license_features JSONB;
  max_usage_limit INTEGER;
BEGIN
  -- Determine features and limits based on plan
  IF plan = 'pro' THEN
    license_features := '{
      "unlimited_verifications": true,
      "pdf_export": true,
      "priority_support": false,
      "api_access": false,
      "bulk_operations": true,
      "advanced_analytics": true
    }'::jsonb;
    max_usage_limit := NULL; -- Unlimited
  ELSIF plan = 'enterprise' THEN
    license_features := '{
      "unlimited_verifications": true,
      "pdf_export": true,
      "priority_support": true,
      "api_access": true,
      "bulk_operations": true,
      "advanced_analytics": true,
      "custom_integrations": true
    }'::jsonb;
    max_usage_limit := NULL; -- Unlimited
  ELSE
    RETURN FALSE; -- Invalid plan
  END IF;
  
  -- Update profile subscription status
  UPDATE public.profiles 
  SET 
    subscription_status = plan,
    subscription_expires_at = COALESCE(expires_date, now() + interval '1 month'),
    updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Deactivate existing licenses
  UPDATE public.licenses 
  SET status = 'expired', updated_at = now()
  WHERE user_id = user_uuid AND status = 'active';
  
  -- Create new license
  INSERT INTO public.licenses (
    user_id,
    license_type,
    status,
    features,
    max_usage,
    current_usage,
    expires_at,
    payment_id,
    license_key
  ) VALUES (
    user_uuid,
    plan::license_type,
    'active'::license_status,
    license_features,
    max_usage_limit,
    0,
    COALESCE(expires_date, now() + interval '1 month'),
    payment_uuid,
    public.generate_license_key()
  );
  
  RETURN TRUE;
END;
$$;