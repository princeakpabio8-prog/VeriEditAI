-- Phase 2A: User Verification Behavior Tracking
ALTER TABLE public.verifications
ADD COLUMN device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
ADD COLUMN verification_source TEXT CHECK (verification_source IN ('web', 'extension', 'api')),
ADD COLUMN session_id TEXT,
ADD COLUMN time_to_verify_ms INTEGER,
ADD COLUMN user_confidence_override BOOLEAN DEFAULT false;

-- Phase 2B: Content Sentiment & Entity Extraction
ALTER TABLE public.verifications
ADD COLUMN sentiment_score NUMERIC CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
ADD COLUMN sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'mixed')),
ADD COLUMN detected_entities JSONB DEFAULT '{}'::jsonb,
ADD COLUMN claim_type TEXT CHECK (claim_type IN ('factual', 'opinion', 'statistical', 'prediction'));

-- Phase 2C: Viral Spread & Cross-Platform Tracking
CREATE TABLE public.verification_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES public.verifications(id) ON DELETE CASCADE NOT NULL,
  shared_to_platform TEXT NOT NULL CHECK (shared_to_platform IN ('twitter', 'facebook', 'whatsapp', 'linkedin', 'email', 'other')),
  share_count INTEGER DEFAULT 1,
  unique_viewers INTEGER DEFAULT 0,
  avg_view_duration_seconds INTEGER,
  geographic_spread JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on verification_shares
ALTER TABLE public.verification_shares ENABLE ROW LEVEL SECURITY;

-- Users can track shares for their verifications
CREATE POLICY "Users can manage shares for their verifications"
  ON public.verification_shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.verifications v
      WHERE v.id = verification_shares.verification_id
      AND v.user_id = auth.uid()
    )
  );

-- Public can view shares for public verifications
CREATE POLICY "Public can view shares for public verifications"
  ON public.verification_shares
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.verifications v
      JOIN public.public_verifications pv ON pv.verification_id = v.id
      WHERE v.id = verification_shares.verification_id
      AND pv.is_active = true
    )
  );

-- Phase 2D: Source Ownership & Funding Transparency
ALTER TABLE public.source_reputation
ADD COLUMN owner_entity TEXT,
ADD COLUMN funding_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN political_leaning_score INTEGER CHECK (political_leaning_score >= -100 AND political_leaning_score <= 100),
ADD COLUMN factual_reporting_score INTEGER CHECK (factual_reporting_score >= 0 AND factual_reporting_score <= 100),
ADD COLUMN transparency_rating TEXT CHECK (transparency_rating IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'));

-- Create indexes for efficient queries
CREATE INDEX idx_verifications_sentiment ON public.verifications(sentiment_label);
CREATE INDEX idx_verifications_claim_type ON public.verifications(claim_type);
CREATE INDEX idx_verifications_device_type ON public.verifications(device_type);
CREATE INDEX idx_verification_shares_platform ON public.verification_shares(shared_to_platform);
CREATE INDEX idx_verification_shares_verification_id ON public.verification_shares(verification_id);
CREATE INDEX idx_source_reputation_political_leaning ON public.source_reputation(political_leaning_score);

-- Add trigger for updated_at on verification_shares
CREATE TRIGGER update_verification_shares_updated_at
  BEFORE UPDATE ON public.verification_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();