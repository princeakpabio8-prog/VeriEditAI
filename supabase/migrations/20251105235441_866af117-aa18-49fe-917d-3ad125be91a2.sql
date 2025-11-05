-- Ensure all new users get 20 free verifications monthly
-- Update the trigger that creates licenses on signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  -- Create trial license with 20 free verifications
  INSERT INTO public.licenses (
    user_id,
    license_type,
    max_usage,
    current_usage,
    starts_at,
    expires_at
  ) VALUES (
    NEW.id,
    'trial',
    20,  -- 20 free verifications monthly
    0,
    NOW(),
    NOW() + INTERVAL '30 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing trial users who have max_usage < 20
UPDATE public.licenses
SET max_usage = 20
WHERE license_type = 'trial' 
  AND (max_usage IS NULL OR max_usage < 20);

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and trial license with 20 free monthly verifications on signup';