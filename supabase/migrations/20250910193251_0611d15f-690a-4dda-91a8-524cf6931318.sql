-- SECURITY FIX: Set search_path for all functions to prevent SQL injection
-- This addresses the "Function Search Path Mutable" security warning

-- Fix all existing functions by setting a secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$function$;

CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text
LANGUAGE sql
SET search_path = public
AS $function$
  SELECT upper(
    substr(gen_random_uuid()::text, 1, 8) || '-' ||
    substr(gen_random_uuid()::text, 1, 4) || '-' ||
    substr(gen_random_uuid()::text, 1, 4) || '-' ||
    substr(gen_random_uuid()::text, 1, 12)
  );
$function$;

CREATE OR REPLACE FUNCTION public.validate_license(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(
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
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_feature_access(user_uuid uuid, feature_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(
    (
      SELECT CASE 
        WHEN features ? feature_name THEN (features ->> feature_name)::boolean
        ELSE false
      END
      FROM public.licenses 
      WHERE user_id = user_uuid 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY created_at DESC
      LIMIT 1
    ),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.increment_license_usage(user_uuid uuid, amount integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  license_rec RECORD;
  new_usage INTEGER;
BEGIN
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