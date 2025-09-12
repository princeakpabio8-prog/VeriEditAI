-- Update create_trial_license function to give 5 verifications per month instead of 10 for 7 days
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
  
  -- Create free plan license (was trial)
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
    'trial'::license_type, -- Keep as trial type but rename functionality to "free plan"
    'active'::license_status,
    '{
      "verification": true,
      "unlimited_verifications": false,
      "pdf_export": false,
      "priority_support": false,
      "api_access": false,
      "bulk_operations": false,
      "advanced_analytics": false,
      "verification_limit": true,
      "plan_name": "Free Plan",
      "monthly_reset": true
    }'::jsonb,
    5, -- Changed from 10 to 5 free verifications
    0,
    now() + interval '30 days', -- Changed from 7 days to 30 days
    public.generate_license_key()
  );
  
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Create function to reset monthly usage for free plan users
CREATE OR REPLACE FUNCTION public.reset_monthly_usage_for_free_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Reset usage for trial licenses that have expired and extend them for another month
  UPDATE public.licenses 
  SET 
    current_usage = 0,
    expires_at = now() + interval '30 days',
    updated_at = now()
  WHERE license_type = 'trial'
    AND status = 'active'
    AND expires_at <= now()
    AND max_usage = 5; -- Only reset free plan licenses (5 verification limit)
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'reset_count', reset_count,
    'message', 'Monthly usage reset completed for free plan users'
  );
END;
$function$;

-- Update existing trial licenses to new 5-verification monthly system (only affect 10-verification trials)
UPDATE public.licenses 
SET 
  max_usage = 5,
  expires_at = CASE 
    WHEN expires_at < now() THEN now() + interval '30 days'
    ELSE expires_at + interval '23 days' -- Extend existing 7-day periods to 30 days
  END,
  features = features || '{"plan_name": "Free Plan", "monthly_reset": true}'::jsonb,
  updated_at = now()
WHERE license_type = 'trial' 
  AND status = 'active' 
  AND max_usage = 10; -- Only update the old 10-verification trials