-- Create reengagement tracking table
CREATE TABLE IF NOT EXISTS public.reengagement_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  channel TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create weekly challenges table
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value NUMERIC,
  participation_count INTEGER DEFAULT 0,
  winner_count INTEGER DEFAULT 3,
  status TEXT DEFAULT 'active',
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Add communication preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reengagement_paused_until TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.reengagement_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reengagement_tracking
CREATE POLICY "Users can view their own tracking"
  ON public.reengagement_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert tracking"
  ON public.reengagement_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all tracking"
  ON public.reengagement_tracking FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for weekly_challenges
CREATE POLICY "Anyone can view active challenges"
  ON public.weekly_challenges FOR SELECT
  USING (status = 'active');

CREATE POLICY "Service role can manage challenges"
  ON public.weekly_challenges FOR ALL
  USING (true);

-- RLS Policies for challenge_participants
CREATE POLICY "Users can view their own participation"
  ON public.challenge_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
  ON public.challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view leaderboard"
  ON public.challenge_participants FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reengagement_user_id ON public.reengagement_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_campaign_type ON public.reengagement_tracking(campaign_type);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.weekly_challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);