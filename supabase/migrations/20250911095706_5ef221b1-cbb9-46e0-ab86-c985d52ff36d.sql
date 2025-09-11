-- Function to clear user verification history
CREATE OR REPLACE FUNCTION public.clear_user_verifications(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete all sources for the user's verifications first
  DELETE FROM public.sources 
  WHERE verification_id IN (
    SELECT id FROM public.verifications WHERE user_id = user_uuid
  );
  
  -- Delete all verification logs for the user's verifications
  DELETE FROM public.verification_logs 
  WHERE verification_id IN (
    SELECT id FROM public.verifications WHERE user_id = user_uuid
  );
  
  -- Delete all verifications for the user and get count
  DELETE FROM public.verifications 
  WHERE user_id = user_uuid;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Reset license usage count to 0 for the user
  UPDATE public.licenses 
  SET current_usage = 0, updated_at = now()
  WHERE user_id = user_uuid AND status = 'active';
  
  RETURN jsonb_build_object(
    'success', true, 
    'deleted_count', deleted_count,
    'message', 'Verification history cleared successfully'
  );
END;
$function$;