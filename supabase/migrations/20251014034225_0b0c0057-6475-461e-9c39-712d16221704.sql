-- Fix digest casting error in detect_duplicate_verification function
CREATE OR REPLACE FUNCTION public.detect_duplicate_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  duplicate_count INTEGER;
  original_verification UUID;
BEGIN
  -- Generate content hash if not provided (FIX: cast to bytea)
  IF NEW.content_hash IS NULL AND NEW.content IS NOT NULL THEN
    NEW.content_hash := encode(digest(LOWER(TRIM(NEW.content))::bytea, 'sha256'), 'hex');
  END IF;

  -- Check for duplicates
  IF NEW.content_hash IS NOT NULL THEN
    SELECT COUNT(*), MIN(id) INTO duplicate_count, original_verification
    FROM public.verifications
    WHERE content_hash = NEW.content_hash
    AND id != NEW.id
    AND created_at < NEW.created_at;

    IF duplicate_count > 0 THEN
      INSERT INTO public.quality_flags (verification_id, flag_type, severity, details)
      VALUES (
        NEW.id,
        'duplicate',
        'medium',
        jsonb_build_object(
          'duplicate_of', original_verification,
          'duplicate_count', duplicate_count
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Clean up stuck image verifications (set to failed status)
UPDATE public.verifications
SET 
  status = 'failed',
  result_summary = 'Auto-failed due to database hash error (now fixed)',
  updated_at = NOW()
WHERE content_type = 'image' 
  AND status = 'processing'
  AND created_at < NOW() - INTERVAL '5 minutes';