-- Fix increment_license_usage to respect admin/unlimited licenses
CREATE OR REPLACE FUNCTION public.increment_license_usage(user_uuid uuid, amount integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lic RECORD;
  v_limit integer;
  is_admin boolean;
  has_unlimited boolean;
BEGIN
  -- Check if user is admin
  SELECT public.has_role(user_uuid, 'admin'::app_role) INTO is_admin;

  -- Ensure license exists and is normalized (auto-provision for non-admins)
  PERFORM public.validate_license(user_uuid);
  SELECT * INTO lic FROM public.licenses WHERE user_id = user_uuid;

  -- Determine if this license should be treated as unlimited
  has_unlimited := COALESCE((lic.features->>'unlimited_verifications')::boolean, false);

  IF is_admin OR has_unlimited THEN
    -- Admins / unlimited licenses: no usage cap
    lic.current_usage := COALESCE(lic.current_usage, 0);
    v_limit := NULL; -- Explicitly indicate no limit
  ELSE
    -- Regular users: enforce max_usage with sane defaults
    lic.max_usage := COALESCE(lic.max_usage, 10);
    lic.current_usage := COALESCE(lic.current_usage, 0);
    v_limit := lic.max_usage;
  END IF;

  IF lic.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'inactive_license', 'limit', v_limit);
  END IF;

  IF lic.expires_at IS NOT NULL AND lic.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired', 'limit', v_limit);
  END IF;

  -- Only enforce hard cap when we actually have a numeric limit
  IF v_limit IS NOT NULL AND lic.current_usage + amount > v_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'limit_reached', 'limit', v_limit);
  END IF;

  -- Always track usage, even for unlimited/admin, for analytics
  UPDATE public.licenses
  SET current_usage = COALESCE(lic.current_usage, 0) + amount,
      updated_at = now()
  WHERE user_id = user_uuid;

  RETURN jsonb_build_object('success', true, 'limit', v_limit);
END;
$function$;