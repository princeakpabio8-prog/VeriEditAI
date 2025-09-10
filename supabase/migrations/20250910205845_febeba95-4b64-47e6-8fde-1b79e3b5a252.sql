-- Create enums for consistent data types
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE payment_status AS ENUM ('pending', 'successful', 'failed');

-- Drop existing payments table if it has different structure
DROP TABLE IF EXISTS public.payments CASCADE;

-- Create payments table according to specifications
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  amount NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  tx_ref TEXT UNIQUE NOT NULL,
  flw_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan plan_type NOT NULL DEFAULT 'free',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  last_payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" 
ON public.payments 
FOR UPDATE 
USING (true);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_tx_ref ON public.payments(tx_ref);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(active);

-- Create function to handle successful payments and subscription updates
CREATE OR REPLACE FUNCTION public.handle_successful_payment(
  payment_id UUID,
  user_uuid UUID,
  plan_name plan_type,
  payment_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate subscription end date (1 month from now)
  subscription_end_date := now() + interval '1 month';
  
  -- Update payment status to successful
  UPDATE public.payments 
  SET status = 'successful'
  WHERE id = payment_id AND user_id = user_uuid;
  
  -- Upsert subscription record
  INSERT INTO public.subscriptions (
    user_id, 
    plan, 
    start_date, 
    end_date, 
    active, 
    auto_renew, 
    last_payment_id
  ) VALUES (
    user_uuid,
    plan_name,
    now(),
    subscription_end_date,
    true,
    false,
    payment_id
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = EXCLUDED.plan,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    active = EXCLUDED.active,
    last_payment_id = EXCLUDED.last_payment_id,
    updated_at = now();
    
  -- Update profile subscription status if profiles table exists
  UPDATE public.profiles 
  SET 
    subscription_status = plan_name::text,
    subscription_expires_at = subscription_end_date,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN true;
END;
$$;

-- Create function to handle failed payments
CREATE OR REPLACE FUNCTION public.handle_failed_payment(
  payment_id UUID,
  user_uuid UUID,
  failure_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update payment status to failed
  UPDATE public.payments 
  SET 
    status = 'failed',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('failure_reason', failure_reason)
  WHERE id = payment_id AND user_id = user_uuid;
  
  RETURN true;
END;
$$;

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_uuid UUID)
RETURNS TABLE(
  plan plan_type,
  active BOOLEAN,
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN,
  days_remaining INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.plan,
    s.active,
    s.end_date,
    s.auto_renew,
    CASE 
      WHEN s.end_date IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM s.end_date - now())::INTEGER)
    END as days_remaining
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid;
$$;

-- Add metadata column to payments for additional Flutterwave data
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;