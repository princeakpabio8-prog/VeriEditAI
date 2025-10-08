-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_email TEXT,
  signup_completed BOOLEAN DEFAULT FALSE,
  bonus_credits_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired'))
);

-- Add indexes for performance
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- RLS Policies for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Add referral tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS bonus_verifications INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to handle referral signup
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_uuid UUID;
  referral_code_used TEXT;
BEGIN
  -- Get referral code from metadata if exists
  referral_code_used := NEW.raw_user_meta_data->>'referral_code';
  
  IF referral_code_used IS NOT NULL THEN
    -- Find the referrer
    SELECT user_id INTO referrer_uuid
    FROM profiles
    WHERE referral_code = referral_code_used;
    
    IF referrer_uuid IS NOT NULL THEN
      -- Update the referral record if exists
      UPDATE referrals
      SET 
        referred_user_id = NEW.id,
        signup_completed = TRUE,
        completed_at = NOW(),
        status = 'completed',
        bonus_credits_awarded = 10
      WHERE referral_code = referral_code_used;
      
      -- Award bonus to referrer
      UPDATE profiles
      SET 
        bonus_verifications = bonus_verifications + 10,
        total_referrals = total_referrals + 1
      WHERE user_id = referrer_uuid;
      
      -- Set referred_by for new user (will be set when profile is created)
      -- Also give welcome bonus
      INSERT INTO referrals (referrer_id, referred_user_id, referral_code, signup_completed, status, bonus_credits_awarded, completed_at)
      VALUES (referrer_uuid, NEW.id, referral_code_used, TRUE, 'completed', 10, NOW())
      ON CONFLICT (referral_code) DO UPDATE
      SET referred_user_id = NEW.id, signup_completed = TRUE, completed_at = NOW(), status = 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral signup
DROP TRIGGER IF EXISTS on_referral_signup ON auth.users;
CREATE TRIGGER on_referral_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_signup();

-- Update existing profiles to generate referral codes
UPDATE profiles 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(user_uuid UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_referrals', COALESCE(p.total_referrals, 0),
    'bonus_verifications', COALESCE(p.bonus_verifications, 0),
    'referral_code', p.referral_code,
    'pending_referrals', (SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'pending'),
    'completed_referrals', (SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed')
  )
  FROM profiles p
  WHERE p.user_id = user_uuid;
$$;