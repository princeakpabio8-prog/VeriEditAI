-- =====================================================
-- GAMIFICATION ENHANCEMENT TABLES
-- =====================================================

-- Verification streaks tracking
CREATE TABLE IF NOT EXISTS public.verification_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_verification_date DATE,
  streak_freeze_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  verification_count INTEGER NOT NULL DEFAULT 0,
  trust_score_avg NUMERIC(5,2),
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Team challenges
CREATE TABLE IF NOT EXISTS public.team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.lighthouse_rooms(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('verification_count', 'trust_score_avg', 'source_diversity', 'speed')),
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- NFT badge evolution tracking
CREATE TABLE IF NOT EXISTS public.badge_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES public.nft_badges(id) ON DELETE CASCADE,
  evolution_level INTEGER NOT NULL DEFAULT 1,
  verifications_contributed INTEGER NOT NULL DEFAULT 0,
  evolution_threshold INTEGER NOT NULL DEFAULT 10,
  special_traits JSONB DEFAULT '[]'::jsonb,
  evolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(badge_id)
);

-- =====================================================
-- VIRAL CLAIM DETECTION ENHANCEMENT
-- =====================================================

-- Claim mentions (track individual sightings)
CREATE TABLE IF NOT EXISTS public.claim_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viral_claim_id UUID NOT NULL REFERENCES public.viral_claims(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  source_url TEXT NOT NULL,
  engagement_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- UX ENHANCEMENTS TABLES
-- =====================================================

-- Email digest preferences and tracking
CREATE TABLE IF NOT EXISTS public.email_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'never')),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  highlights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Social sharing tracking (for analytics)
CREATE TABLE IF NOT EXISTS public.share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('verification', 'thread', 'badge', 'achievement')),
  content_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'whatsapp', 'copy_link')),
  user_id UUID REFERENCES auth.users(id),
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_verification_streaks_user ON public.verification_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON public.leaderboard_entries(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard_entries(period_type, rank);
CREATE INDEX IF NOT EXISTS idx_team_challenges_room ON public.team_challenges(room_id, status);
CREATE INDEX IF NOT EXISTS idx_team_challenges_dates ON public.team_challenges(start_date, end_date, status);
CREATE INDEX IF NOT EXISTS idx_badge_evolution_badge ON public.badge_evolution(badge_id);
CREATE INDEX IF NOT EXISTS idx_claim_mentions_viral ON public.claim_mentions(viral_claim_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_digests_user ON public.email_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digests_next_send ON public.email_digests(next_send_at) WHERE next_send_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_share_events_content ON public.share_events(content_type, content_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.verification_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- Verification streaks policies
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.verification_streaks;
CREATE POLICY "Users can view their own streaks"
  ON public.verification_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON public.verification_streaks;
CREATE POLICY "Users can update their own streaks"
  ON public.verification_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Leaderboard policies
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;
CREATE POLICY "Anyone can view leaderboards"
  ON public.leaderboard_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage leaderboards" ON public.leaderboard_entries;
CREATE POLICY "Service role can manage leaderboards"
  ON public.leaderboard_entries FOR ALL
  USING (true);

-- Team challenges policies
DROP POLICY IF EXISTS "Room members can view challenges" ON public.team_challenges;
CREATE POLICY "Room members can view challenges"
  ON public.team_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships
      WHERE room_id = team_challenges.room_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Room owners can create challenges" ON public.team_challenges;
CREATE POLICY "Room owners can create challenges"
  ON public.team_challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships
      WHERE room_id = team_challenges.room_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'moderator')
    )
  );

-- Badge evolution policies
DROP POLICY IF EXISTS "Anyone can view badge evolution" ON public.badge_evolution;
CREATE POLICY "Anyone can view badge evolution"
  ON public.badge_evolution FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage badge evolution" ON public.badge_evolution;
CREATE POLICY "Service role can manage badge evolution"
  ON public.badge_evolution FOR ALL
  USING (true);

-- Claim mentions policies
DROP POLICY IF EXISTS "Anyone can view claim mentions" ON public.claim_mentions;
CREATE POLICY "Anyone can view claim mentions"
  ON public.claim_mentions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert claim mentions" ON public.claim_mentions;
CREATE POLICY "Service role can insert claim mentions"
  ON public.claim_mentions FOR INSERT
  WITH CHECK (true);

-- Email digest policies
DROP POLICY IF EXISTS "Users can manage their own digest settings" ON public.email_digests;
CREATE POLICY "Users can manage their own digest settings"
  ON public.email_digests FOR ALL
  USING (auth.uid() = user_id);

-- Share events policies
DROP POLICY IF EXISTS "Anyone can create share events" ON public.share_events;
CREATE POLICY "Anyone can create share events"
  ON public.share_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all share events" ON public.share_events;
CREATE POLICY "Admins can view all share events"
  ON public.share_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_verification_streaks_updated_at ON public.verification_streaks;
CREATE TRIGGER update_verification_streaks_updated_at
  BEFORE UPDATE ON public.verification_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leaderboard_entries_updated_at ON public.leaderboard_entries;
CREATE TRIGGER update_leaderboard_entries_updated_at
  BEFORE UPDATE ON public.leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_challenges_updated_at ON public.team_challenges;
CREATE TRIGGER update_team_challenges_updated_at
  BEFORE UPDATE ON public.team_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_badge_evolution_updated_at ON public.badge_evolution;
CREATE TRIGGER update_badge_evolution_updated_at
  BEFORE UPDATE ON public.badge_evolution
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_digests_updated_at ON public.email_digests;
CREATE TRIGGER update_email_digests_updated_at
  BEFORE UPDATE ON public.email_digests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update verification streak
CREATE OR REPLACE FUNCTION public.update_verification_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak record
  INSERT INTO public.verification_streaks (user_id, current_streak, longest_streak, last_verification_date)
  VALUES (p_user_id, 0, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_verification_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.verification_streaks
  WHERE user_id = p_user_id;

  -- Update streak logic
  IF v_last_date IS NULL OR v_last_date < v_today THEN
    IF v_last_date = v_today - INTERVAL '1 day' THEN
      -- Continue streak
      v_current_streak := v_current_streak + 1;
    ELSIF v_last_date < v_today - INTERVAL '1 day' THEN
      -- Streak broken
      v_current_streak := 1;
    ELSE
      -- Same day, no change
      RETURN;
    END IF;

    -- Update longest streak if needed
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    UPDATE public.verification_streaks
    SET 
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_verification_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Function to calculate leaderboard positions
CREATE OR REPLACE FUNCTION public.refresh_leaderboards()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update ranks for all period types
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY period_type, period_start ORDER BY points DESC, verification_count DESC) as new_rank
    FROM public.leaderboard_entries
  )
  UPDATE public.leaderboard_entries le
  SET rank = ranked.new_rank, updated_at = now()
  FROM ranked
  WHERE le.id = ranked.id;
END;
$$;