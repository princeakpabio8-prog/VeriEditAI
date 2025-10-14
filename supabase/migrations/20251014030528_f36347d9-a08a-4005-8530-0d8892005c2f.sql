-- Create quality_flags table to track verification quality issues
CREATE TABLE IF NOT EXISTS public.quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'low_confidence', 'insufficient_sources', 'low_source_quality', 'duplicate', 'contradiction'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  details JSONB DEFAULT '{}'::jsonb,
  auto_flagged BOOLEAN DEFAULT true,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT, -- 'approved', 'rejected', 'fixed', 'escalated'
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_quality_flags_verification ON public.quality_flags(verification_id);
CREATE INDEX idx_quality_flags_reviewed ON public.quality_flags(reviewed);
CREATE INDEX idx_quality_flags_severity ON public.quality_flags(severity);
CREATE INDEX idx_quality_flags_type ON public.quality_flags(flag_type);

-- Enable RLS
ALTER TABLE public.quality_flags ENABLE ROW LEVEL SECURITY;

-- Admins can manage all quality flags
CREATE POLICY "Admins can manage quality flags"
  ON public.quality_flags
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view flags for their own verifications
CREATE POLICY "Users can view their quality flags"
  ON public.quality_flags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.verifications v
      WHERE v.id = quality_flags.verification_id
      AND v.user_id = auth.uid()
    )
  );

-- Public can view flags for shared verifications
CREATE POLICY "Public can view flags for shared verifications"
  ON public.quality_flags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.verifications v
      JOIN public.public_verifications pv ON pv.verification_id = v.id
      WHERE v.id = quality_flags.verification_id
      AND pv.is_active = true
    )
  );

-- Function to auto-flag low confidence verifications
CREATE OR REPLACE FUNCTION public.auto_flag_verification()
RETURNS TRIGGER AS $$
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

  -- Check source count
  SELECT COUNT(*) INTO source_count
  FROM public.sources
  WHERE verification_id = NEW.id;

  IF source_count < 3 THEN
    INSERT INTO public.quality_flags (verification_id, flag_type, severity, details)
    VALUES (
      NEW.id,
      'insufficient_sources',
      CASE 
        WHEN source_count = 0 THEN 'critical'
        WHEN source_count = 1 THEN 'high'
        ELSE 'medium'
      END,
      jsonb_build_object(
        'source_count', source_count,
        'minimum_required', 3
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for low quality sources (reliability < 30)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-flag verifications
DROP TRIGGER IF EXISTS trigger_auto_flag_verification ON public.verifications;
CREATE TRIGGER trigger_auto_flag_verification
  AFTER INSERT OR UPDATE OF trust_score ON public.verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_flag_verification();

-- Add content_hash to verifications for duplicate detection
ALTER TABLE public.verifications 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_verifications_content_hash 
ON public.verifications(content_hash) 
WHERE content_hash IS NOT NULL;

-- Function to detect duplicate verifications
CREATE OR REPLACE FUNCTION public.detect_duplicate_verification()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
  original_verification UUID;
BEGIN
  -- Generate content hash if not provided
  IF NEW.content_hash IS NULL AND NEW.content IS NOT NULL THEN
    NEW.content_hash := encode(digest(LOWER(TRIM(NEW.content)), 'sha256'), 'hex');
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for duplicate detection
DROP TRIGGER IF EXISTS trigger_detect_duplicate ON public.verifications;
CREATE TRIGGER trigger_detect_duplicate
  BEFORE INSERT ON public.verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_duplicate_verification();

-- Update existing verifications with content hashes
UPDATE public.verifications 
SET content_hash = encode(digest(LOWER(TRIM(content)), 'sha256'), 'hex')
WHERE content_hash IS NULL AND content IS NOT NULL;

-- Function to get quality status for a verification
CREATE OR REPLACE FUNCTION public.get_verification_quality_status(verification_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  quality_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'has_flags', COUNT(*) > 0,
    'flag_count', COUNT(*),
    'critical_count', COUNT(*) FILTER (WHERE severity = 'critical'),
    'high_count', COUNT(*) FILTER (WHERE severity = 'high'),
    'flags', jsonb_agg(
      jsonb_build_object(
        'type', flag_type,
        'severity', severity,
        'details', details,
        'reviewed', reviewed
      )
    ) FILTER (WHERE flag_type IS NOT NULL)
  )
  INTO quality_data
  FROM public.quality_flags
  WHERE verification_id = verification_uuid
  AND NOT reviewed;

  RETURN COALESCE(quality_data, '{
    "has_flags": false,
    "flag_count": 0,
    "critical_count": 0,
    "high_count": 0,
    "flags": []
  }'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;