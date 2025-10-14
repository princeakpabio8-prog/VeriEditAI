-- Create viral_claims table
CREATE TABLE IF NOT EXISTS public.viral_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_text TEXT NOT NULL,
  claim_hash TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'reddit', 'news')),
  source_url TEXT NOT NULL,
  author TEXT,
  engagement_score INTEGER DEFAULT 0,
  engagement_velocity NUMERIC DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  peak_engagement INTEGER DEFAULT 0,
  status TEXT DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'verified', 'debunked', 'expired')),
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on claim_hash for deduplication
CREATE INDEX IF NOT EXISTS idx_viral_claims_claim_hash ON public.viral_claims(claim_hash);
CREATE INDEX IF NOT EXISTS idx_viral_claims_status ON public.viral_claims(status);
CREATE INDEX IF NOT EXISTS idx_viral_claims_platform ON public.viral_claims(platform);
CREATE INDEX IF NOT EXISTS idx_viral_claims_engagement_velocity ON public.viral_claims(engagement_velocity DESC);

-- Create engagement_snapshots table
CREATE TABLE IF NOT EXISTS public.engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viral_claim_id UUID NOT NULL REFERENCES public.viral_claims(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_engagement_snapshots_viral_claim ON public.engagement_snapshots(viral_claim_id, recorded_at DESC);

-- Create trending_topics table
CREATE TABLE IF NOT EXISTS public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  mention_count INTEGER DEFAULT 0,
  detected_at TIMESTAMPTZ DEFAULT now(),
  related_claims JSONB DEFAULT '[]'::jsonb
);

-- Create index on topic and platform
CREATE INDEX IF NOT EXISTS idx_trending_topics_topic ON public.trending_topics(topic, platform);

-- Enable RLS
ALTER TABLE public.viral_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for viral_claims
CREATE POLICY "Admins can manage viral claims"
  ON public.viral_claims
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view verified/debunked viral claims"
  ON public.viral_claims
  FOR SELECT
  USING (status IN ('verified', 'debunked'));

-- RLS Policies for engagement_snapshots
CREATE POLICY "Admins can view all engagement snapshots"
  ON public.engagement_snapshots
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert engagement snapshots"
  ON public.engagement_snapshots
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for trending_topics
CREATE POLICY "Admins can manage trending topics"
  ON public.trending_topics
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view trending topics"
  ON public.trending_topics
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_viral_claims_updated_at
  BEFORE UPDATE ON public.viral_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();