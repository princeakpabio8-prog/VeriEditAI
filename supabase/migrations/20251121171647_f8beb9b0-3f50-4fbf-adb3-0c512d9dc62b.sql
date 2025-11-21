-- Update validate_license function to give admins unlimited access
CREATE OR REPLACE FUNCTION public.validate_license(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  license_rec RECORD;
  is_admin BOOLEAN;
BEGIN
  -- ADMIN BYPASS: Check if user is admin first
  SELECT public.has_role(user_uuid, 'admin'::app_role) INTO is_admin;
  
  IF is_admin THEN
    RETURN jsonb_build_object(
      'valid', true,
      'license_type', 'enterprise',
      'status', 'active',
      'max_usage', null,
      'current_usage', 0,
      'features', jsonb_build_object(
        'unlimited_verifications', true,
        'verification', true,
        'nft_minting', true,
        'api_access', true,
        'bulk_operations', true,
        'advanced_analytics', true,
        'priority_support', true,
        'plan_name', 'Admin - Unlimited'
      ),
      'expires_at', null,
      'reason', 'admin_unlimited'
    );
  END IF;
  
  -- Regular license validation for non-admins
  SELECT * INTO license_rec
  FROM public.licenses
  WHERE user_id = user_uuid
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Auto-provision trial license if none exists
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
      user_uuid,
      'trial-' || user_uuid,
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
    RETURNING * INTO license_rec;
  END IF;
  
  -- Check if license is expired
  IF license_rec.expires_at IS NOT NULL AND license_rec.expires_at <= NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'license_type', license_rec.license_type,
      'status', 'expired',
      'reason', 'license_expired',
      'expires_at', license_rec.expires_at
    );
  END IF;
  
  -- Check usage limits
  IF license_rec.max_usage IS NOT NULL AND license_rec.current_usage >= license_rec.max_usage THEN
    RETURN jsonb_build_object(
      'valid', false,
      'license_type', license_rec.license_type,
      'status', license_rec.status,
      'max_usage', license_rec.max_usage,
      'current_usage', license_rec.current_usage,
      'reason', 'usage_limit_reached'
    );
  END IF;
  
  -- Return valid license
  RETURN jsonb_build_object(
    'valid', true,
    'license_type', license_rec.license_type,
    'status', license_rec.status,
    'max_usage', license_rec.max_usage,
    'current_usage', license_rec.current_usage,
    'features', license_rec.features,
    'expires_at', license_rec.expires_at
  );
END;
$function$;

-- Update admin user's license to unlimited
UPDATE public.licenses 
SET 
  max_usage = NULL,
  current_usage = 0,
  license_type = 'enterprise',
  status = 'active',
  features = jsonb_build_object(
    'unlimited_verifications', true,
    'verification', true,
    'nft_minting', true,
    'api_access', true,
    'bulk_operations', true,
    'advanced_analytics', true,
    'priority_support', true,
    'plan_name', 'Admin - Unlimited'
  ),
  expires_at = NULL,
  updated_at = NOW()
WHERE user_id = (
  SELECT user_id 
  FROM auth.users 
  WHERE email = 'princeakpabio8@gmail.com'
);