-- Create trust_analytics table for aggregated verification data
CREATE TABLE public.trust_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  domain TEXT,
  region TEXT NOT NULL,
  topic TEXT NOT NULL,
  average_trust_score INTEGER NOT NULL,
  verification_count INTEGER NOT NULL DEFAULT 0,
  trending_direction TEXT, -- 'up', 'down', 'stable'
  week_over_week_change NUMERIC(5,2), -- percentage change
  credibility_tier TEXT, -- 'high', 'medium', 'low'
  metadata JSONB DEFAULT '{}'::jsonb,
  analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_trust_analytics_region ON public.trust_analytics(region);
CREATE INDEX idx_trust_analytics_topic ON public.trust_analytics(topic);
CREATE INDEX idx_trust_analytics_source ON public.trust_analytics(source);
CREATE INDEX idx_trust_analytics_created_at ON public.trust_analytics(created_at DESC);
CREATE INDEX idx_trust_analytics_credibility_tier ON public.trust_analytics(credibility_tier);

-- Enable RLS
ALTER TABLE public.trust_analytics ENABLE ROW LEVEL SECURITY;

-- Public read access for free weekly index
CREATE POLICY "Anyone can view trust analytics"
  ON public.trust_analytics FOR SELECT
  USING (true);

-- Only admins can insert/update
CREATE POLICY "Admins can manage trust analytics"
  ON public.trust_analytics FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trust_index_snapshots table for historical tracking
CREATE TABLE public.trust_index_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_trust_index NUMERIC(5,2) NOT NULL, -- 0-100 scale
  snapshot_date DATE NOT NULL UNIQUE,
  total_verifications INTEGER NOT NULL,
  high_credibility_percentage NUMERIC(5,2),
  misinformation_spike_regions TEXT[],
  trending_low_topics TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trust_snapshots_date ON public.trust_index_snapshots(snapshot_date DESC);

-- Enable RLS - public read access
ALTER TABLE public.trust_index_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trust index snapshots"
  ON public.trust_index_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trust index snapshots"
  ON public.trust_index_snapshots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trust_briefs table for AI-generated summaries
CREATE TABLE public.trust_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  brief_content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trust_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trust briefs"
  ON public.trust_briefs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trust briefs"
  ON public.trust_briefs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_trust_analytics_updated_at
  BEFORE UPDATE ON public.trust_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();