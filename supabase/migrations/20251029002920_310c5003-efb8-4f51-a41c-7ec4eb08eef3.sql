-- Truth Bounty Marketplace Schema

-- Bounty categories enum
CREATE TYPE bounty_category AS ENUM (
  'election',
  'ai',
  'health',
  'policy',
  'education',
  'climate',
  'finance',
  'general'
);

-- Bounty status enum
CREATE TYPE bounty_status AS ENUM (
  'active',
  'claimed',
  'in_review',
  'completed',
  'expired',
  'cancelled'
);

-- Payment type enum
CREATE TYPE payment_type AS ENUM (
  'fiat',
  'crypto'
);

-- Main bounties table
CREATE TABLE public.truth_bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  claim_to_verify TEXT NOT NULL,
  
  category bounty_category NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  
  reward_amount NUMERIC(10, 2) NOT NULL,
  reward_currency TEXT NOT NULL DEFAULT 'USD',
  payment_type payment_type NOT NULL DEFAULT 'fiat',
  
  status bounty_status NOT NULL DEFAULT 'active',
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  min_trust_score INTEGER DEFAULT 50,
  required_sources INTEGER DEFAULT 3,
  
  auto_ping_sent BOOLEAN DEFAULT FALSE,
  auto_ping_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Bounty claims tracking
CREATE TABLE public.bounty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES public.truth_bounties(id) ON DELETE CASCADE NOT NULL,
  verifier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'in_progress',
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(bounty_id, verifier_id)
);

-- Bounty completions and results
CREATE TABLE public.bounty_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES public.truth_bounties(id) ON DELETE CASCADE NOT NULL,
  claim_id UUID REFERENCES public.bounty_claims(id) ON DELETE CASCADE NOT NULL,
  verifier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  verified_claim TEXT NOT NULL,
  confidence_score INTEGER NOT NULL,
  summary TEXT NOT NULL,
  
  nft_badge_id UUID REFERENCES public.nft_badges(id) ON DELETE SET NULL,
  nft_minted BOOLEAN DEFAULT FALSE,
  
  approved_by_org BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(bounty_id)
);

-- Bounty earnings tracking
CREATE TABLE public.bounty_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID REFERENCES public.bounty_completions(id) ON DELETE CASCADE NOT NULL,
  bounty_id UUID REFERENCES public.truth_bounties(id) ON DELETE CASCADE NOT NULL,
  verifier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  reward_amount NUMERIC(10, 2) NOT NULL,
  service_fee NUMERIC(10, 2) NOT NULL,
  verifier_payout NUMERIC(10, 2) NOT NULL,
  
  payment_type payment_type NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  
  transaction_hash TEXT,
  payment_reference TEXT,
  
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Auto-ping notification tracking
CREATE TABLE public.bounty_auto_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES public.truth_bounties(id) ON DELETE CASCADE NOT NULL,
  
  recipient_type TEXT NOT NULL, -- 'organization', 'verifier', 'partner'
  recipient_id UUID,
  recipient_email TEXT,
  
  category bounty_category NOT NULL,
  
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent',
  
  response_received BOOLEAN DEFAULT FALSE,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Verifier category preferences
CREATE TABLE public.verifier_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  preferred_categories bounty_category[] DEFAULT '{}',
  auto_ping_enabled BOOLEAN DEFAULT TRUE,
  
  min_reward_amount NUMERIC(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.truth_bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_auto_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifier_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for truth_bounties
CREATE POLICY "Anyone can view active bounties"
  ON public.truth_bounties FOR SELECT
  USING (status = 'active' OR auth.uid() = created_by);

CREATE POLICY "Organizations can create bounties"
  ON public.truth_bounties FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization creators can update their bounties"
  ON public.truth_bounties FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for bounty_claims
CREATE POLICY "Anyone can view claims for active bounties"
  ON public.bounty_claims FOR SELECT
  USING (true);

CREATE POLICY "Verifiers can claim bounties"
  ON public.bounty_claims FOR INSERT
  WITH CHECK (auth.uid() = verifier_id);

CREATE POLICY "Verifiers can update their claims"
  ON public.bounty_claims FOR UPDATE
  USING (auth.uid() = verifier_id);

-- RLS Policies for bounty_completions
CREATE POLICY "Anyone can view completed bounties"
  ON public.bounty_completions FOR SELECT
  USING (true);

CREATE POLICY "Verifiers can submit completions"
  ON public.bounty_completions FOR INSERT
  WITH CHECK (auth.uid() = verifier_id);

CREATE POLICY "Organizations can approve completions"
  ON public.bounty_completions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.truth_bounties tb
    WHERE tb.id = bounty_completions.bounty_id
    AND tb.created_by = auth.uid()
  ));

-- RLS Policies for bounty_earnings
CREATE POLICY "Verifiers can view their earnings"
  ON public.bounty_earnings FOR SELECT
  USING (auth.uid() = verifier_id);

CREATE POLICY "Organizations can view their payments"
  ON public.bounty_earnings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = bounty_earnings.organization_id
  ));

CREATE POLICY "Admins can manage earnings"
  ON public.bounty_earnings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for bounty_auto_pings
CREATE POLICY "Service role can manage auto-pings"
  ON public.bounty_auto_pings FOR ALL
  USING (true);

CREATE POLICY "Admins can view auto-pings"
  ON public.bounty_auto_pings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for verifier_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.verifier_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_bounties_status ON public.truth_bounties(status);
CREATE INDEX idx_bounties_category ON public.truth_bounties(category);
CREATE INDEX idx_bounties_expires ON public.truth_bounties(expires_at);
CREATE INDEX idx_bounties_organization ON public.truth_bounties(organization_id);
CREATE INDEX idx_claims_bounty ON public.bounty_claims(bounty_id);
CREATE INDEX idx_claims_verifier ON public.bounty_claims(verifier_id);
CREATE INDEX idx_completions_bounty ON public.bounty_completions(bounty_id);
CREATE INDEX idx_earnings_verifier ON public.bounty_earnings(verifier_id);
CREATE INDEX idx_auto_pings_bounty ON public.bounty_auto_pings(bounty_id);

-- Triggers for updated_at
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON public.truth_bounties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.verifier_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate service fee
CREATE OR REPLACE FUNCTION calculate_service_fee(reward_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  -- 7.5% service fee (between 5-10%)
  RETURN ROUND(reward_amount * 0.075, 2);
END;
$$;

-- Function to get top verifiers by category
CREATE OR REPLACE FUNCTION get_top_verifiers_by_category(
  p_category bounty_category,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  completions INTEGER,
  avg_confidence NUMERIC,
  total_earned NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    COUNT(bc.id)::INTEGER as completions,
    AVG(bc.confidence_score)::NUMERIC(5,2) as avg_confidence,
    COALESCE(SUM(be.verifier_payout), 0)::NUMERIC(10,2) as total_earned
  FROM public.profiles p
  JOIN public.bounty_completions bc ON bc.verifier_id = p.user_id
  JOIN public.truth_bounties tb ON tb.id = bc.bounty_id
  LEFT JOIN public.bounty_earnings be ON be.verifier_id = p.user_id
  WHERE tb.category = p_category
    AND bc.approved_by_org = true
  GROUP BY p.user_id, p.username, p.full_name
  ORDER BY completions DESC, avg_confidence DESC
  LIMIT p_limit;
$$;