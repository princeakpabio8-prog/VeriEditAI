-- ============================================================================
-- PHASE 1: Enhanced Source Reliability Scoring
-- ============================================================================

-- Migration 1: Create source_reputation table
CREATE TABLE public.source_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  base_score INTEGER NOT NULL DEFAULT 60,
  accuracy_rate NUMERIC(5,2), -- 0-100 percentage
  verification_count INTEGER NOT NULL DEFAULT 0,
  successful_verifications INTEGER NOT NULL DEFAULT 0,
  failed_verifications INTEGER NOT NULL DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  political_bias INTEGER, -- -100 (left) to +100 (right)
  editorial_quality INTEGER, -- 0-100
  region TEXT, -- 'US', 'UK', 'EU', 'CA', 'AU', 'Global'
  source_type TEXT, -- 'government', 'academic', 'news', 'fact-checker', 'social-media'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for source_reputation
CREATE INDEX idx_source_reputation_domain ON public.source_reputation(domain);
CREATE INDEX idx_source_reputation_region ON public.source_reputation(region);
CREATE INDEX idx_source_reputation_type ON public.source_reputation(source_type);
CREATE INDEX idx_source_reputation_accuracy ON public.source_reputation(accuracy_rate DESC);

-- RLS Policies for source_reputation
ALTER TABLE public.source_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view source reputations"
ON public.source_reputation FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage source reputations"
ON public.source_reputation FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_source_reputation_updated_at
BEFORE UPDATE ON public.source_reputation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration 2: Create dynamic score adjustment function
CREATE OR REPLACE FUNCTION public.get_adjusted_source_score(
  _domain TEXT,
  _base_score INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reputation_record RECORD;
  adjusted_score INTEGER;
BEGIN
  -- Get reputation data
  SELECT * INTO reputation_record
  FROM public.source_reputation
  WHERE domain = _domain;
  
  -- If no reputation data exists, return base score
  IF NOT FOUND THEN
    RETURN _base_score;
  END IF;
  
  -- Start with base score
  adjusted_score := _base_score;
  
  -- Adjust based on accuracy rate (only if we have enough data)
  IF reputation_record.verification_count >= 10 THEN
    IF reputation_record.accuracy_rate >= 95 THEN
      adjusted_score := adjusted_score + 8;
    ELSIF reputation_record.accuracy_rate >= 90 THEN
      adjusted_score := adjusted_score + 5;
    ELSIF reputation_record.accuracy_rate >= 80 THEN
      adjusted_score := adjusted_score + 2;
    ELSIF reputation_record.accuracy_rate < 50 THEN
      adjusted_score := adjusted_score - 15;
    ELSIF reputation_record.accuracy_rate < 60 THEN
      adjusted_score := adjusted_score - 10;
    ELSIF reputation_record.accuracy_rate < 70 THEN
      adjusted_score := adjusted_score - 5;
    END IF;
  END IF;
  
  -- Bonus for editorial quality (if rated)
  IF reputation_record.editorial_quality IS NOT NULL THEN
    IF reputation_record.editorial_quality >= 90 THEN
      adjusted_score := adjusted_score + 3;
    END IF;
  END IF;
  
  -- Cap at 0-100
  adjusted_score := GREATEST(0, LEAST(100, adjusted_score));
  
  RETURN adjusted_score;
END;
$$;

-- Migration 3: Update sources table
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS base_reliability_score INTEGER,
ADD COLUMN IF NOT EXISTS adjusted_reliability_score INTEGER,
ADD COLUMN IF NOT EXISTS political_bias INTEGER,
ADD COLUMN IF NOT EXISTS source_region TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT;

-- Indexes for sources
CREATE INDEX IF NOT EXISTS idx_sources_domain ON public.sources(domain);
CREATE INDEX IF NOT EXISTS idx_sources_reliability ON public.sources(adjusted_reliability_score DESC);

-- ============================================================================
-- PHASE 2: Advanced Fact Categories
-- ============================================================================

-- Migration 4: Create verification_categories table
CREATE TABLE public.verification_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  parent_category TEXT,
  detection_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  min_sources INTEGER DEFAULT 3,
  max_source_age_days INTEGER, -- NULL = no age limit
  required_source_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for verification_categories
CREATE INDEX idx_verification_categories_name ON public.verification_categories(name);
CREATE INDEX idx_verification_categories_active ON public.verification_categories(is_active);

-- RLS Policies for verification_categories
ALTER TABLE public.verification_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
ON public.verification_categories FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.verification_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for verification_categories
CREATE TRIGGER update_verification_categories_updated_at
BEFORE UPDATE ON public.verification_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration 5: Seed category data
INSERT INTO public.verification_categories (name, display_name, description, keywords, detection_patterns, verification_criteria, confidence_weights, min_sources, max_source_age_days, required_source_types) VALUES

('scientific', 'Scientific Research', 'Scientific studies, research papers, clinical trials', 
 '["research", "study", "clinical trial", "peer-reviewed", "scientist", "laboratory", "experiment", "hypothesis", "methodology", "published"]'::jsonb,
 '["(study|research) (shows?|indicates?|suggests?)", "according to (scientists?|researchers?)", "peer-reviewed", "clinical trial"]'::jsonb,
 '{"require_peer_review": true, "min_publication_date": "5_years", "require_methodology": true, "verify_sample_size": true}'::jsonb,
 '{"source_quality": 0.45, "consensus": 0.30, "recency": 0.15, "completeness": 0.10}'::jsonb,
 3, 1825, ARRAY['academic', 'government']::TEXT[]),

('financial', 'Financial & Economic', 'Stock prices, market data, economic indicators', 
 '["stock", "market", "GDP", "inflation", "nasdaq", "dow jones", "cryptocurrency", "federal reserve", "interest rate", "earnings", "revenue"]'::jsonb,
 '["stock price", "market (cap|value)", "\\$[0-9,]+", "GDP", "inflation rate", "\\d+%", "quarter|Q[1-4]"]'::jsonb,
 '{"require_official_data": true, "require_timestamps": true, "verify_calculations": true, "check_market_hours": true}'::jsonb,
 '{"source_quality": 0.40, "consensus": 0.25, "recency": 0.25, "accuracy": 0.10}'::jsonb,
 2, 1, ARRAY['government', 'news']::TEXT[]),

('legal', 'Legal & Regulatory', 'Court cases, laws, regulations, legal precedents', 
 '["court", "lawsuit", "verdict", "judge", "legal", "regulation", "compliance", "attorney", "ruling", "supreme court", "appeal"]'::jsonb,
 '["court ruled", "judge (ruled|ordered)", "verdict", "lawsuit", "legal (precedent|case)", "regulation"]'::jsonb,
 '{"require_official_records": true, "verify_jurisdiction": true, "check_appeal_status": true, "verify_case_number": true}'::jsonb,
 '{"source_quality": 0.50, "consensus": 0.20, "recency": 0.15, "official_records": 0.15}'::jsonb,
 2, NULL, ARRAY['government', 'news']::TEXT[]),

('historical', 'Historical Events', 'Past events, dates, historical figures, wars, treaties', 
 '["war", "treaty", "empire", "ancient", "medieval", "century", "founded", "established", "born", "died", "historical", "artifact"]'::jsonb,
 '["in (\\d{4}|\\d{2}th century)", "during (the|World War)", "founded in", "born in", "died in"]'::jsonb,
 '{"require_multiple_sources": true, "prefer_academic": true, "verify_dates": true, "check_primary_sources": true}'::jsonb,
 '{"source_quality": 0.40, "consensus": 0.35, "recency": 0.05, "historical_accuracy": 0.20}'::jsonb,
 3, NULL, ARRAY['academic', 'government']::TEXT[]),

('geopolitical', 'Geopolitical Claims', 'International relations, borders, diplomatic events', 
 '["embassy", "diplomatic", "NATO", "UN", "sanctions", "border", "territory", "treaty", "alliance", "sovereignty"]'::jsonb,
 '["country|nation", "border (dispute|conflict)", "diplomatic (relations|crisis)", "sanctions", "UN (resolution|vote)"]'::jsonb,
 '{"verify_official_statements": true, "check_international_sources": true, "verify_timeline": true}'::jsonb,
 '{"source_quality": 0.45, "consensus": 0.25, "recency": 0.20, "official_confirmation": 0.10}'::jsonb,
 3, 365, ARRAY['government', 'news']::TEXT[]),

('social-media-viral', 'Viral Social Media Claims', 'Trending posts, viral videos, memes with factual claims', 
 '["viral", "trending", "meme", "tiktok", "instagram", "twitter", "facebook", "went viral", "influencer", "social media"]'::jsonb,
 '["went viral", "trending on", "viral (video|post)", "according to (Twitter|TikTok|Instagram)"]'::jsonb,
 '{"verify_original_source": true, "check_manipulation": true, "verify_context": true, "detect_satire": true}'::jsonb,
 '{"source_quality": 0.50, "consensus": 0.20, "recency": 0.15, "context": 0.15}'::jsonb,
 4, 30, ARRAY['fact-checker', 'news']::TEXT[]),

('sports', 'Sports & Entertainment', 'Sports statistics, entertainment facts, box office data', 
 '["championship", "league", "tournament", "score", "points", "team", "player", "movie", "album", "box office", "award"]'::jsonb,
 '["(won|scored|defeated)", "championship", "record of \\d+", "box office"]'::jsonb,
 '{"verify_official_statistics": true, "check_league_records": true}'::jsonb,
 '{"source_quality": 0.35, "consensus": 0.30, "recency": 0.25, "official_stats": 0.10}'::jsonb,
 2, 7, ARRAY['news']::TEXT[]),

('statistical', 'Statistical Claims', 'Polls, surveys, percentages, statistical data', 
 '["survey", "poll", "census", "statistics", "data", "percentage", "\\d+%", "majority", "most", "study found"]'::jsonb,
 '["\\d+(\\.\\d+)?%", "(survey|poll) (shows?|found)", "according to (data|statistics)", "census"]'::jsonb,
 '{"verify_sample_size": true, "check_methodology": true, "verify_margin_of_error": true, "check_date_conducted": true}'::jsonb,
 '{"source_quality": 0.40, "consensus": 0.25, "recency": 0.20, "methodology": 0.15}'::jsonb,
 3, 180, ARRAY['government', 'academic', 'news']::TEXT[]);

-- Migration 6: Update verifications table
ALTER TABLE public.verifications
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS category_confidence INTEGER,
ADD COLUMN IF NOT EXISTS detected_categories JSONB DEFAULT '[]'::jsonb;

-- Indexes for verifications
CREATE INDEX IF NOT EXISTS idx_verifications_category ON public.verifications(category);
CREATE INDEX IF NOT EXISTS idx_verifications_category_confidence ON public.verifications(category_confidence DESC);