-- Fix the digest function type casting issue in detect_duplicate_verification trigger
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
  -- Generate content hash only for non-image content types
  -- Images are verified by Google Vision, not by content text
  IF NEW.content_hash IS NULL AND NEW.content IS NOT NULL AND NEW.content_type != 'image' THEN
    -- Fix: Use convert_to() to properly convert text to bytea for digest function
    NEW.content_hash := encode(digest(convert_to(LOWER(TRIM(NEW.content)), 'UTF8'), 'sha256'), 'hex');
  END IF;

  -- Check for duplicates (skip if no hash)
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