-- Create achievements master table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  category text NOT NULL CHECK (category IN ('verification', 'social', 'nft', 'contribution', 'special')),
  icon_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL,
  requirement_value integer,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user achievements linking table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress_current integer DEFAULT 0,
  progress_required integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Create user leaderboard stats
CREATE TABLE IF NOT EXISTS public.user_leaderboard_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  total_verifications integer DEFAULT 0,
  total_nft_badges integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  total_lighthouse_contributions integer DEFAULT 0,
  total_achievement_points integer DEFAULT 0,
  highest_trust_score integer DEFAULT 0,
  verification_streak integer DEFAULT 0,
  last_verification_date date,
  rank integer,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' achievements"
ON public.user_achievements FOR SELECT
USING (true);

CREATE POLICY "Service role can manage user achievements"
ON public.user_achievements FOR ALL
USING (true);

-- RLS Policies for leaderboard stats
CREATE POLICY "Anyone can view leaderboard stats"
ON public.user_leaderboard_stats FOR SELECT
USING (true);

CREATE POLICY "Service role can manage leaderboard stats"
ON public.user_leaderboard_stats FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON public.user_achievements(earned_at DESC);
CREATE INDEX idx_leaderboard_stats_rank ON public.user_leaderboard_stats(rank);
CREATE INDEX idx_leaderboard_stats_points ON public.user_leaderboard_stats(total_achievement_points DESC);
CREATE INDEX idx_achievements_category ON public.achievements(category);

-- Seed initial achievements
INSERT INTO public.achievements (achievement_key, name, description, tier, category, icon_name, points, requirement_type, requirement_value) VALUES
-- Verification achievements
('first_steps', 'First Steps', 'Complete your first verification', 'bronze', 'verification', 'Target', 10, 'count', 1),
('truth_seeker', 'Truth Seeker', 'Complete 10 verifications', 'silver', 'verification', 'Search', 25, 'count', 10),
('fact_champion', 'Fact Champion', 'Complete 50 verifications', 'gold', 'verification', 'Award', 100, 'count', 50),
('truth_master', 'Truth Master', 'Complete 100 verifications', 'platinum', 'verification', 'Crown', 250, 'count', 100),
('legendary_verifier', 'Legendary Verifier', 'Complete 500 verifications', 'diamond', 'verification', 'Gem', 1000, 'count', 500),
('perfect_score', 'Perfect Score', 'Get 10 verifications with 100% trust score', 'gold', 'verification', 'Star', 150, 'count', 10),
('speed_demon', 'Speed Demon', 'Complete 10 verifications in 24 hours', 'gold', 'verification', 'Zap', 200, 'special', 10),

-- NFT achievements
('badge_collector', 'Badge Collector', 'Mint your first NFT badge', 'bronze', 'nft', 'Badge', 15, 'count', 1),
('badge_hoarder', 'Badge Hoarder', 'Mint 5 NFT badges', 'silver', 'nft', 'BadgeCheck', 50, 'count', 5),
('badge_master', 'Badge Master', 'Mint 20 NFT badges', 'gold', 'nft', 'Trophy', 200, 'count', 20),
('whale', 'Whale', 'Own 50 NFT badges', 'diamond', 'nft', 'Coins', 500, 'count', 50),

-- Social achievements
('first_share', 'First Share', 'Share your first verification', 'bronze', 'social', 'Share2', 10, 'count', 1),
('influencer', 'Influencer', 'Share 100 verifications', 'gold', 'social', 'Megaphone', 150, 'count', 100),
('team_player', 'Team Player', 'Join 5 Lighthouse rooms', 'silver', 'social', 'Users', 40, 'count', 5),
('conversationalist', 'Conversationalist', 'Post 50 comments', 'silver', 'social', 'MessageSquare', 60, 'count', 50),
('community_leader', 'Community Leader', 'Create a Lighthouse room', 'gold', 'social', 'Flag', 100, 'count', 1),

-- Special achievements
('early_adopter', 'Early Adopter', 'Join in the first month', 'platinum', 'special', 'Rocket', 500, 'special', 0),
('referral_master', 'Referral Master', 'Refer 10 users successfully', 'gold', 'special', 'Gift', 200, 'count', 10),
('api_pioneer', 'API Pioneer', 'Use API integration', 'silver', 'special', 'Code', 75, 'special', 0),
('curator', 'Curator', 'Contribute to 10 organization verifications', 'gold', 'contribution', 'Library', 150, 'count', 10)
ON CONFLICT (achievement_key) DO NOTHING;