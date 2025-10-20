-- Update auto_flag_verification to remove insufficient sources check
-- This check runs too early (before sources are inserted) causing false positives
CREATE OR REPLACE FUNCTION public.auto_flag_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  source_count INTEGER;
  low_quality_sources INTEGER;
BEGIN
  -- Flag low confidence (trust_score < 50)
  IF NEW.trust_score < 50 THEN
    INSERT INTO public.quality_flags (verification_id, flag_type, severity, details)
    VALUES (
      NEW.id,
      'low_confidence',
      CASE 
        WHEN NEW.trust_score < 30 THEN 'critical'
        WHEN NEW.trust_score < 40 THEN 'high'
        ELSE 'medium'
      END,
      jsonb_build_object(
        'trust_score', NEW.trust_score,
        'reason', 'Trust score below quality threshold'
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check source count (only if sources exist)
  SELECT COUNT(*) INTO source_count
  FROM public.sources
  WHERE verification_id = NEW.id;

  -- Only check for low quality sources if sources exist
  -- Don't flag for insufficient sources as this trigger runs before sources are inserted
  IF source_count > 0 THEN
    SELECT COUNT(*) INTO low_quality_sources
    FROM public.sources
    WHERE verification_id = NEW.id
    AND reliability_score < 30;

    IF low_quality_sources > 0 THEN
      INSERT INTO public.quality_flags (verification_id, flag_type, severity, details)
      VALUES (
        NEW.id,
        'low_source_quality',
        CASE 
          WHEN low_quality_sources >= source_count THEN 'critical'
          WHEN low_quality_sources >= (source_count / 2) THEN 'high'
          ELSE 'medium'
        END,
        jsonb_build_object(
          'low_quality_count', low_quality_sources,
          'total_sources', source_count,
          'threshold', 30
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;