-- Phase 1: Enhance viral_claims table with rarity tracking
ALTER TABLE viral_claims 
ADD COLUMN IF NOT EXISTS platform_category TEXT DEFAULT 'social_media',
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS virality_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rarity_tier TEXT;

-- Phase 2: Enhance nft_badges table with rarity and race data
ALTER TABLE nft_badges
ADD COLUMN IF NOT EXISTS rarity_tier TEXT,
ADD COLUMN IF NOT EXISTS viral_claim_id UUID REFERENCES viral_claims(id),
ADD COLUMN IF NOT EXISTS virality_score NUMERIC,
ADD COLUMN IF NOT EXISTS minted_at_rank INTEGER;

-- Phase 3: Create verification_races table for first verifier tracking
CREATE TABLE IF NOT EXISTS verification_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viral_claim_id UUID REFERENCES viral_claims(id) NOT NULL,
  claim_text TEXT NOT NULL,
  first_verifier_id UUID REFERENCES auth.users(id),
  first_verified_at TIMESTAMP WITH TIME ZONE,
  first_verification_id UUID REFERENCES verifications(id),
  second_verifier_id UUID REFERENCES auth.users(id),
  second_verified_at TIMESTAMP WITH TIME ZONE,
  second_verification_id UUID REFERENCES verifications(id),
  third_verifier_id UUID REFERENCES auth.users(id),
  third_verified_at TIMESTAMP WITH TIME ZONE,
  third_verification_id UUID REFERENCES verifications(id),
  total_verifiers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on verification_races
ALTER TABLE verification_races ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view verification races
CREATE POLICY "Anyone can view verification races"
  ON verification_races
  FOR SELECT
  USING (true);

-- Policy: Service role can manage races
CREATE POLICY "Service role can manage races"
  ON verification_races
  FOR ALL
  USING (true);

-- Phase 4: Add first verifier achievements (using correct tier system)
INSERT INTO achievements (achievement_key, name, description, tier, category, requirement_type, requirement_value, points, icon_name, is_hidden) VALUES
('first_blood', 'First Blood', 'Be the first to verify a viral claim', 'diamond', 'verification', 'first_verifications', 1, 100, 'Zap', false),
('speed_demon', 'Speed Demon', 'Verify 5 viral claims within 1 hour of detection', 'platinum', 'verification', 'speed_verifications', 5, 50, 'Gauge', false),
('truth_racer', 'Truth Racer', 'Win 10 verification races', 'gold', 'verification', 'first_verifications', 10, 30, 'Trophy', false),
('legendary_hunter', 'Legendary Hunter', 'Mint a LEGENDARY rarity badge', 'diamond', 'nft', 'legendary_badges', 1, 150, 'Crown', false),
('epic_collector', 'Epic Collector', 'Own 5 EPIC or higher rarity badges', 'platinum', 'nft', 'epic_badges', 5, 75, 'Gem', false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Phase 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_viral_claims_rarity ON viral_claims(rarity_tier) WHERE rarity_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_viral_claims_virality_score ON viral_claims(virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_nft_badges_rarity ON nft_badges(rarity_tier) WHERE rarity_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_races_viral_claim ON verification_races(viral_claim_id);
CREATE INDEX IF NOT EXISTS idx_verification_races_first_verifier ON verification_races(first_verifier_id);