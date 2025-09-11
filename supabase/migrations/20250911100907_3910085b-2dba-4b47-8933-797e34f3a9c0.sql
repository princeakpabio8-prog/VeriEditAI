-- Update validate_license function to include verification feature
CREATE OR REPLACE FUNCTION public.validate_license(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- First check if user is admin
  SELECT CASE 
    WHEN public.has_role(user_uuid, 'admin'::app_role) THEN
      jsonb_build_object(
        'valid', true,
        'license_type', 'enterprise',
        'status', 'active',
        'features', jsonb_build_object(
          'verification', true,
          'unlimited_verifications', true,
          'pdf_export', true,
          'priority_support', true,
          'api_access', true,
          'bulk_operations', true,
          'advanced_analytics', true,
          'custom_integrations', true,
          'admin_access', true
        ),
        'max_usage', null,
        'current_usage', 0,
        'expires_at', null
      )
    ELSE
      COALESCE(
        (
          SELECT jsonb_build_object(
            'valid', true,
            'license_type', license_type,
            'status', status,
            'features', features || jsonb_build_object('verification', true),
            'max_usage', max_usage,
            'current_usage', current_usage,
            'expires_at', expires_at
          )
          FROM public.licenses 
          WHERE user_id = user_uuid 
            AND status = 'active'
            AND (expires_at IS NULL OR expires_at > now())
          ORDER BY created_at DESC
          LIMIT 1
        ),
        jsonb_build_object('valid', false, 'reason', 'no_valid_license')
      )
  END;
$function$;

-- Update create_trial_license function to include verification feature
CREATE OR REPLACE FUNCTION public.create_trial_license(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user already has a license
  IF EXISTS (SELECT 1 FROM public.licenses WHERE user_id = user_uuid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'license_already_exists');
  END IF;
  
  -- Create trial license
  INSERT INTO public.licenses (
    user_id,
    license_type,
    status,
    features,
    max_usage,
    current_usage,
    expires_at,
    license_key
  ) VALUES (
    user_uuid,
    'trial'::license_type,
    'active'::license_status,
    '{
      "verification": true,
      "unlimited_verifications": false,
      "pdf_export": false,
      "priority_support": false,
      "api_access": false,
      "bulk_operations": false,
      "advanced_analytics": false,
      "verification_limit": true
    }'::jsonb,
    10, -- 10 free verifications
    0,
    now() + interval '7 days', -- 7 day trial
    public.generate_license_key()
  );
  
  RETURN jsonb_build_object('success', true);
END;
$function$;