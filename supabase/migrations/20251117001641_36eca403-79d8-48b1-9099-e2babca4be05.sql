-- Validate and provision license for a user
CREATE OR REPLACE FUNCTION public.validate_license(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lic RECORD;
  v_valid boolean := false;
  v_reason text := null;
  default_features jsonb := jsonb_build_object(
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
  );
BEGIN
  -- Ensure a license row exists (auto-provision trial if missing)
  SELECT * INTO lic FROM public.licenses WHERE user_id = user_uuid;

  IF NOT FOUND THEN
    INSERT INTO public.licenses (
      user_id, license_key, license_type, status, max_usage, current_usage, features, last_reset_at, expires_at
    ) VALUES (
      user_uuid,
      'trial-' || user_uuid::text,
      'trial',
      'active',
      10,
      0,
      default_features,
      now(),
      now() + interval '30 days'
    )
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO lic FROM public.licenses WHERE user_id = user_uuid;
  END IF;

  -- Defaults if null
  lic.features := COALESCE(lic.features, default_features);
  lic.max_usage := COALESCE(lic.max_usage, 10);
  lic.current_usage := COALESCE(lic.current_usage, 0);

  -- Determine validity
  IF lic.status <> 'active' THEN
    v_valid := false; v_reason := lic.status::text;
  ELSIF lic.expires_at IS NOT NULL AND lic.expires_at <= now() THEN
    v_valid := false; v_reason := 'expired';
  ELSIF lic.max_usage IS NOT NULL AND lic.current_usage >= lic.max_usage THEN
    v_valid := false; v_reason := 'limit_reached';
  ELSE
    v_valid := true;
  END IF;

  RETURN jsonb_build_object(
    'valid', v_valid,
    'license_type', lic.license_type,
    'status', lic.status,
    'features', lic.features,
    'max_usage', lic.max_usage,
    'current_usage', lic.current_usage,
    'expires_at', lic.expires_at,
    'reason', v_reason
  );
END;
$$;

-- Safely increment license usage with limit checks
CREATE OR REPLACE FUNCTION public.increment_license_usage(user_uuid uuid, amount integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lic RECORD;
  v_limit integer;
BEGIN
  -- Ensure license exists and is normalized
  PERFORM public.validate_license(user_uuid);
  SELECT * INTO lic FROM public.licenses WHERE user_id = user_uuid;

  lic.max_usage := COALESCE(lic.max_usage, 10);
  lic.current_usage := COALESCE(lic.current_usage, 0);
  v_limit := lic.max_usage;

  IF lic.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'inactive_license', 'limit', v_limit);
  END IF;

  IF lic.expires_at IS NOT NULL AND lic.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired', 'limit', v_limit);
  END IF;

  IF v_limit IS NOT NULL AND lic.current_usage + amount > v_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'limit_reached', 'limit', v_limit);
  END IF;

  UPDATE public.licenses
  SET current_usage = lic.current_usage + amount,
      updated_at = now()
  WHERE user_id = user_uuid;

  RETURN jsonb_build_object('success', true, 'limit', v_limit);
END;
$$;