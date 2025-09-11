-- Set up admin role for princeakpabio8@gmail.com and create trial license setup

-- First, let's insert the admin user role (assuming the user exists)
-- This will need to be done after the user signs up with that email
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the user ID for the admin email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'princeakpabio8@gmail.com';
    
    -- Only proceed if the user exists
    IF admin_user_id IS NOT NULL THEN
        -- Insert admin role (ignore if already exists)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Create unlimited admin license (deactivate existing first)
        UPDATE public.licenses 
        SET status = 'expired'::license_status, updated_at = now()
        WHERE user_id = admin_user_id AND status = 'active'::license_status;
        
        -- Create new admin license with unlimited features
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
            admin_user_id,
            'enterprise'::license_type,
            'active'::license_status,
            '{
                "unlimited_verifications": true,
                "pdf_export": true,
                "priority_support": true,
                "api_access": true,
                "bulk_operations": true,
                "advanced_analytics": true,
                "custom_integrations": true,
                "admin_access": true
            }'::jsonb,
            NULL, -- Unlimited usage
            0,
            NULL, -- Never expires
            public.generate_license_key()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Update the validate_license function to check for admin privileges
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
            'features', features,
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

-- Update the increment_license_usage function to allow unlimited for admins
CREATE OR REPLACE FUNCTION public.increment_license_usage(user_uuid uuid, amount integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  license_rec RECORD;
  new_usage INTEGER;
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
  
  -- Check if usage would exceed limit
  new_usage := license_rec.current_usage + amount;
  IF license_rec.max_usage IS NOT NULL AND new_usage > license_rec.max_usage THEN
    RETURN jsonb_build_object('success', false, 'error', 'usage_limit_exceeded', 'limit', license_rec.max_usage);
  END IF;
  
  -- Update usage
  UPDATE public.licenses 
  SET current_usage = new_usage,
      updated_at = now()
  WHERE id = license_rec.id;
  
  RETURN jsonb_build_object('success', true, 'new_usage', new_usage, 'limit', license_rec.max_usage);
END;
$function$;

-- Function to create trial license for new users
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

-- Trigger to create trial license for new users (except admin)
CREATE OR REPLACE FUNCTION public.handle_new_user_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Don't create trial for admin email
  IF NEW.email = 'princeakpabio8@gmail.com' THEN
    RETURN NEW;
  END IF;
  
  -- Create trial license for new user
  PERFORM public.create_trial_license(NEW.id);
  RETURN NEW;
END;
$function$;

-- Create trigger for new user license creation
DROP TRIGGER IF EXISTS on_auth_user_license_created ON auth.users;
CREATE TRIGGER on_auth_user_license_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_license();