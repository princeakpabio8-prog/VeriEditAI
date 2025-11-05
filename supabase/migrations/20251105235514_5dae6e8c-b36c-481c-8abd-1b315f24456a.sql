-- Fix security warning: Set search_path for handle_new_user function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';