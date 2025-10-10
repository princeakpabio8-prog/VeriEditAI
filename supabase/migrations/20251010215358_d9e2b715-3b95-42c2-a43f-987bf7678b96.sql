-- Quick Wins Implementation: Upvotes + Profile Fixes (Fixed)

-- 1. Create thread_votes table for upvote/downvote tracking
CREATE TABLE IF NOT EXISTS public.thread_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.room_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all votes"
  ON public.thread_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON public.thread_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.thread_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.thread_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_thread_votes_thread_id ON public.thread_votes(thread_id);
CREATE INDEX idx_thread_votes_user_id ON public.thread_votes(user_id);

-- 2. Function to update upvote count when votes change
CREATE OR REPLACE FUNCTION public.update_thread_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  upvote_total INTEGER;
BEGIN
  -- Count net upvotes (upvotes - downvotes)
  SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
  INTO upvote_total
  FROM public.thread_votes
  WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id);
  
  -- Update the thread
  UPDATE public.room_threads
  SET upvote_count = GREATEST(0, upvote_total),
      updated_at = now()
  WHERE id = COALESCE(NEW.thread_id, OLD.thread_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
CREATE TRIGGER thread_vote_insert_trigger
  AFTER INSERT ON public.thread_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_upvote_count();

CREATE TRIGGER thread_vote_update_trigger
  AFTER UPDATE ON public.thread_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_upvote_count();

CREATE TRIGGER thread_vote_delete_trigger
  AFTER DELETE ON public.thread_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_upvote_count();

-- 3. Backfill existing profiles with names from auth.users email
UPDATE public.profiles p
SET full_name = SPLIT_PART(au.email, '@', 1)
FROM auth.users au
WHERE p.user_id = au.id
  AND (p.full_name IS NULL OR p.full_name = '');

-- 4. Update handle_new_user trigger to capture full_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(
    EXCLUDED.full_name,
    public.profiles.full_name
  );
  
  RETURN NEW;
END;
$$;