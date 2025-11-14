-- Fix the handle_new_user trigger function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create user profile with correct column names
  INSERT INTO public.profiles (
    user_id,
    full_name,
    company
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create trial license with 10 free monthly verifications
  INSERT INTO public.licenses (
    user_id,
    license_type,
    max_usage,
    current_usage,
    last_reset_at,
    status
  ) VALUES (
    NEW.id,
    'trial',
    10,
    0,
    NOW(),
    'active'
  )
  ON CONFLICT (user_id) WHERE license_type = 'trial' 
  DO UPDATE SET
    max_usage = 10,
    current_usage = 0,
    last_reset_at = NOW(),
    status = 'active',
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists and is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();