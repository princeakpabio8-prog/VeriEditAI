-- Create function to initialize license for new users
CREATE OR REPLACE FUNCTION public.initialize_user_license()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a trial license for the new user
  INSERT INTO public.licenses (
    user_id,
    license_key,
    license_type,
    status,
    max_usage,
    current_usage,
    features,
    last_reset_at
  )
  VALUES (
    NEW.id,
    'trial-' || NEW.id,
    'trial',
    'active',
    10,
    0,
    jsonb_build_object(
      'verification', true,
      'verification_limit', true,
      'verifications', 10,
      'nft_minting', true,
      'plan_name', 'Free Plan',
      'monthly_reset', true,
      'unlimited_verifications', false,
      'api_access', false,
      'bulk_operations', false,
      'advanced_analytics', false,
      'priority_support', false
    ),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_license ON auth.users;

-- Create trigger to automatically initialize license on user signup
CREATE TRIGGER on_auth_user_created_license
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_license();