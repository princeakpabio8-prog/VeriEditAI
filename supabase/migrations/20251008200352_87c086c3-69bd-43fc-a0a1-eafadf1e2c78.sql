-- Create enum types for The Lighthouse Room
CREATE TYPE room_type AS ENUM ('public', 'private', 'workspace');
CREATE TYPE room_category AS ENUM ('politics', 'health', 'climate', 'technology', 'media', 'general');
CREATE TYPE badge_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'lighthouse_keeper');
CREATE TYPE thread_status AS ENUM ('active', 'verified', 'disputed', 'archived');

-- Table: lighthouse_rooms
CREATE TABLE public.lighthouse_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type room_type NOT NULL DEFAULT 'public',
  category room_category NOT NULL DEFAULT 'general',
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  thread_count INTEGER NOT NULL DEFAULT 0,
  trust_rating NUMERIC(3,2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: room_threads
CREATE TABLE public.room_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.lighthouse_rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status thread_status NOT NULL DEFAULT 'active',
  trust_score INTEGER,
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  is_auto_verified BOOLEAN DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: thread_comments
CREATE TABLE public.thread_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.room_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.thread_comments(id) ON DELETE CASCADE,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  is_verified_contributor BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: room_memberships
CREATE TABLE public.room_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.lighthouse_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Table: user_badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_tier badge_tier NOT NULL DEFAULT 'bronze',
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table: signal_feed
CREATE TABLE public.signal_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.room_threads(id) ON DELETE CASCADE,
  trust_score INTEGER NOT NULL,
  engagement_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  trending_rank INTEGER,
  featured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lighthouse_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lighthouse_rooms
CREATE POLICY "Anyone can view public rooms"
ON public.lighthouse_rooms FOR SELECT
USING (room_type = 'public' OR room_type = 'workspace');

CREATE POLICY "Authenticated users can create rooms"
ON public.lighthouse_rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creators can update their rooms"
ON public.lighthouse_rooms FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all rooms"
ON public.lighthouse_rooms FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for room_threads
CREATE POLICY "Anyone can view threads in public rooms"
ON public.room_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lighthouse_rooms
    WHERE id = room_threads.room_id
    AND (room_type = 'public' OR room_type = 'workspace')
  )
);

CREATE POLICY "Authenticated users can create threads"
ON public.room_threads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Thread authors can update their threads"
ON public.room_threads FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- RLS Policies for thread_comments
CREATE POLICY "Anyone can view comments on public threads"
ON public.thread_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_threads rt
    JOIN public.lighthouse_rooms lr ON lr.id = rt.room_id
    WHERE rt.id = thread_comments.thread_id
    AND (lr.room_type = 'public' OR lr.room_type = 'workspace')
  )
);

CREATE POLICY "Authenticated users can create comments"
ON public.thread_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comment authors can update their comments"
ON public.thread_comments FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- RLS Policies for room_memberships
CREATE POLICY "Users can view memberships in their rooms"
ON public.room_memberships FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.lighthouse_rooms
    WHERE id = room_memberships.room_id
    AND room_type = 'public'
  )
);

CREATE POLICY "Users can join rooms"
ON public.room_memberships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_badges
CREATE POLICY "Anyone can view badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "Only system can award badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for signal_feed
CREATE POLICY "Anyone can view signal feed"
ON public.signal_feed FOR SELECT
USING (true);

CREATE POLICY "Admins can manage signal feed"
ON public.signal_feed FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_lighthouse_rooms_category ON public.lighthouse_rooms(category);
CREATE INDEX idx_lighthouse_rooms_type ON public.lighthouse_rooms(room_type);
CREATE INDEX idx_room_threads_room_id ON public.room_threads(room_id);
CREATE INDEX idx_room_threads_status ON public.room_threads(status);
CREATE INDEX idx_thread_comments_thread_id ON public.thread_comments(thread_id);
CREATE INDEX idx_room_memberships_user_id ON public.room_memberships(user_id);
CREATE INDEX idx_signal_feed_trending_rank ON public.signal_feed(trending_rank);

-- Triggers for updated_at
CREATE TRIGGER update_lighthouse_rooms_updated_at
  BEFORE UPDATE ON public.lighthouse_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_threads_updated_at
  BEFORE UPDATE ON public.room_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_thread_comments_updated_at
  BEFORE UPDATE ON public.thread_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();