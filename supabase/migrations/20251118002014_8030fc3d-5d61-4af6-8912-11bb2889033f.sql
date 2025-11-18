-- Ensure ALL users have a proper trial license with 10 free verifications
-- This fixes both new and existing users

-- First, update existing licenses that might be incorrectly configured
UPDATE public.licenses
SET 
  max_usage = 10,
  license_type = 'trial',
  status = 'active',
  features = jsonb_build_object(
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
  updated_at = now()
WHERE license_type = 'trial'
  AND (max_usage IS NULL OR max_usage < 10);

-- Insert missing licenses for users who don't have any
INSERT INTO public.licenses (
  user_id,
  license_key,
  license_type,
  status,
  max_usage,
  current_usage,
  features,
  last_reset_at,
  expires_at
)
SELECT 
  p.user_id,
  'trial-' || p.user_id,
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
  NOW(),
  NOW() + INTERVAL '30 days'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.licenses l
  WHERE l.user_id = p.user_id
  AND l.license_type = 'trial'
  AND l.status = 'active'
)
ON CONFLICT (user_id) WHERE license_type = 'trial' 
DO UPDATE SET
  max_usage = 10,
  status = 'active',
  current_usage = LEAST(EXCLUDED.current_usage, 10),
  features = EXCLUDED.features,
  updated_at = NOW();

-- Update the trigger to ensure it always sets max_usage to 10
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create user profile
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
    license_key,
    license_type,
    status,
    max_usage,
    current_usage,
    features,
    last_reset_at,
    expires_at
  ) VALUES (
    NEW.id,
    'trial-' || NEW.id,
    'trial',
    'active',
    10,  -- Always 10 free verifications
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
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) WHERE license_type = 'trial'
  DO UPDATE SET
    max_usage = 10,
    status = 'active',
    features = EXCLUDED.features,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;