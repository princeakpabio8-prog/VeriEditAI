-- Update the trial license creation to give new users 20 verifications instead of 5

-- First, update the trigger function that creates licenses for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  -- Create a trial license for new users with 20 monthly verifications
  INSERT INTO public.licenses (
    user_id,
    license_type,
    license_key,
    max_usage,
    current_usage,
    status,
    features,
    expires_at
  )
  VALUES (
    NEW.id,
    'trial'::license_type,
    'trial-' || NEW.id,
    20, -- Increased from 5 to 20 monthly verifications
    0,
    'active'::license_status,
    jsonb_build_object(
      'verifications', 20,
      'nft_minting', true,
      'api_access', false,
      'bulk_verification', false,
      'priority_support', false
    ),
    NOW() + INTERVAL '30 days'
  );
  RETURN NEW;
END;
$$;

-- Also update any existing trial licenses that are still at 5 to 20
UPDATE public.licenses
SET 
  max_usage = 20,
  features = jsonb_set(features, '{verifications}', '20'::jsonb)
WHERE 
  license_type = 'trial'::license_type 
  AND max_usage = 5 
  AND status = 'active'::license_status;