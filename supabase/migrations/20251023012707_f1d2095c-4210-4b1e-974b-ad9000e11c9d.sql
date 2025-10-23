-- Create content_translations table for multi-language support
CREATE TABLE IF NOT EXISTS public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid REFERENCES public.verifications(id) ON DELETE CASCADE,
  original_text text NOT NULL,
  source_language varchar(10),
  target_language varchar(10) NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_content_translations_verification ON public.content_translations(verification_id);
CREATE INDEX IF NOT EXISTS idx_content_translations_languages ON public.content_translations(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_content_translations_cache ON public.content_translations(original_text, target_language);

-- Enable RLS
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can view translations for public verifications
CREATE POLICY "Anyone can view translations for public verifications"
ON public.content_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.verifications v
    JOIN public.public_verifications pv ON pv.verification_id = v.id
    WHERE v.id = content_translations.verification_id
    AND pv.is_active = true
  )
);

-- Users can view translations for their own verifications
CREATE POLICY "Users can view their own translations"
ON public.content_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.verifications v
    WHERE v.id = content_translations.verification_id
    AND v.user_id = auth.uid()
  )
);

-- Service role can insert translations
CREATE POLICY "Service role can insert translations"
ON public.content_translations
FOR INSERT
WITH CHECK (true);