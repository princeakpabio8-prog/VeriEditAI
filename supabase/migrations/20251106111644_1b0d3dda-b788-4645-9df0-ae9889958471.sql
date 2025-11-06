-- Fix verification limits: 10 free monthly verifications with auto-reset
-- This addresses the "VERIFICATION LIMIT REACHED" issue

-- Step 1: Update increment_license_usage to auto-reset monthly
CREATE OR REPLACE FUNCTION public.increment_license_usage(user_uuid uuid, amount integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  license_rec RECORD;
  new_usage INTEGER;
  days_since_reset INTEGER;
BEGIN
  -- Check if user is admin (unlimited usage)
  IF public.has_role(user_uuid, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', true, 'new_usage', 0, 'limit', null);
  END IF;
  
  -- Get current license
  SELECT * INTO license_rec
  FROM public.licenses 
  WHERE user_id = user_uuid 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_valid_license');
  END IF;
  
  -- For trial licenses, check if we need to reset monthly usage
  IF license_rec.license_type = 'trial' THEN
    days_since_reset := EXTRACT(day FROM now() - license_rec.last_reset_at);
    
    -- Reset usage if 30 days have passed
    IF days_since_reset >= 30 THEN
      UPDATE public.licenses 
      SET current_usage = 0,
          last_reset_at = now(),
          updated_at = now()
      WHERE id = license_rec.id;
      
      license_rec.current_usage := 0;
      license_rec.last_reset_at := now();
    END IF;
  END IF;
  
  -- Check if usage would exceed limit
  new_usage := license_rec.current_usage + amount;
  IF license_rec.max_usage IS NOT NULL AND new_usage > license_rec.max_usage THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'usage_limit_exceeded', 
      'limit', license_rec.max_usage,
      'current', license_rec.current_usage
    );
  END IF;
  
  -- Update usage
  UPDATE public.licenses 
  SET current_usage = new_usage,
      updated_at = now()
  WHERE id = license_rec.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'new_usage', new_usage, 
    'limit', license_rec.max_usage,
    'reset_date', license_rec.last_reset_at + interval '30 days'
  );
END;
$$;

-- Step 2: Add last_reset_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'licenses' 
    AND column_name = 'last_reset_at'
  ) THEN
    ALTER TABLE public.licenses ADD COLUMN last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Step 3: Update handle_new_user to create 10/month trial licenses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  -- Create trial license with 10 free monthly verifications
  INSERT INTO public.licenses (
    user_id,
    license_type,
    max_usage,
    current_usage,
    last_reset_at,
    expires_at,
    status
  ) VALUES (
    NEW.id,
    'trial',
    10,  -- 10 free verifications per month
    0,
    NOW(),
    NULL  -- No expiration for trial (monthly reset instead)
  )
  ON CONFLICT (user_id) WHERE license_type = 'trial' 
  DO UPDATE SET
    max_usage = 10,
    current_usage = 0,
    last_reset_at = NOW(),
    status = 'active',
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Backfill existing trial licenses to 10 with reset date
UPDATE public.licenses 
SET 
  max_usage = 10,
  last_reset_at = COALESCE(last_reset_at, updated_at, created_at),
  expires_at = NULL,  -- Remove expiration for trials
  status = 'active'
WHERE license_type = 'trial' 
  AND (max_usage IS NULL OR max_usage != 10 OR status != 'active');

-- Step 5: Drop old conflicting triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_license_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_license();
DROP FUNCTION IF EXISTS public.create_trial_license(uuid);

-- Step 6: Ensure the trigger exists for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and trial license with 10 free monthly verifications (auto-resets every 30 days)';
COMMENT ON FUNCTION public.increment_license_usage(uuid, integer) IS 'Increments license usage with automatic monthly reset for trial users';