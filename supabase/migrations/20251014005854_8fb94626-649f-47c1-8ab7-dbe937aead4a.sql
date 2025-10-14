-- Feature 1: Claim Relationships (Contradiction Detection)
CREATE TABLE IF NOT EXISTS public.claim_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_a UUID REFERENCES public.verifications(id) ON DELETE CASCADE NOT NULL,
  claim_b UUID REFERENCES public.verifications(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('supports', 'contradicts', 'related')) NOT NULL,
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(claim_a, claim_b)
);

-- Enable RLS
ALTER TABLE public.claim_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for claim_relationships
CREATE POLICY "Anyone can view claim relationships"
ON public.claim_relationships
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage claim relationships"
ON public.claim_relationships
FOR ALL
USING (true);

-- Indexes for performance
CREATE INDEX idx_claim_relationships_claim_a ON public.claim_relationships(claim_a);
CREATE INDEX idx_claim_relationships_claim_b ON public.claim_relationships(claim_b);
CREATE INDEX idx_claim_relationships_type ON public.claim_relationships(relationship_type);

-- Feature 2: Claim Versions (Version Tracking)
CREATE TABLE IF NOT EXISTS public.claim_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES public.verifications(id) ON DELETE CASCADE NOT NULL,
  original_verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  content_hash TEXT NOT NULL,
  semantic_similarity NUMERIC(5,2) CHECK (semantic_similarity >= 0 AND semantic_similarity <= 100),
  version_number INTEGER DEFAULT 1,
  confidence_delta NUMERIC(6,2), -- change in trust score from previous version
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.claim_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for claim_versions
CREATE POLICY "Anyone can view claim versions"
ON public.claim_versions
FOR SELECT
USING (true);

CREATE POLICY "Users can create versions for their verifications"
ON public.claim_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.verifications v
    WHERE v.id = claim_versions.verification_id
    AND v.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_claim_versions_verification ON public.claim_versions(verification_id);
CREATE INDEX idx_claim_versions_original ON public.claim_versions(original_verification_id);
CREATE INDEX idx_claim_versions_hash ON public.claim_versions(content_hash);

-- Feature 3: Source Freshness - Add published_at to sources table
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Index for source freshness queries
CREATE INDEX IF NOT EXISTS idx_sources_published_at ON public.sources(published_at DESC NULLS LAST);

-- Helper function to calculate source age distribution
CREATE OR REPLACE FUNCTION public.get_source_age_distribution(verification_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'recent', COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - published_at))::INTEGER <= 365),
    'one_to_three_years', COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - published_at))::INTEGER > 365 AND EXTRACT(DAY FROM (NOW() - published_at))::INTEGER <= 1095),
    'three_to_five_years', COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - published_at))::INTEGER > 1095 AND EXTRACT(DAY FROM (NOW() - published_at))::INTEGER <= 1825),
    'over_five_years', COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - published_at))::INTEGER > 1825),
    'unknown', COUNT(*) FILTER (WHERE published_at IS NULL),
    'average_age_days', AVG(EXTRACT(DAY FROM (NOW() - published_at)))::INTEGER,
    'oldest_source_year', EXTRACT(YEAR FROM MIN(published_at))::INTEGER,
    'newest_source_year', EXTRACT(YEAR FROM MAX(published_at))::INTEGER
  )
  INTO result
  FROM public.sources
  WHERE verification_id = verification_uuid;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;