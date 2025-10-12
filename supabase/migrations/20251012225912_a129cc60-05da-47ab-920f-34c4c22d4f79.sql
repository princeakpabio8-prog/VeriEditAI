-- Create user_follows table for social graph
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Add indexes for performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_user_follows_created ON public.user_follows(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can view follows
CREATE POLICY "Anyone can view follows"
ON public.user_follows
FOR SELECT
TO authenticated
USING (true);

-- Users can follow others (insert their own follows)
CREATE POLICY "Users can follow others"
ON public.user_follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
ON public.user_follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- Add follower/following counts to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE public.profiles
    SET following_count = following_count + 1
    WHERE user_id = NEW.follower_id;
    
    -- Increment followers count for followed user
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
    
    -- Create notification for followed user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      NEW.following_id,
      'follow',
      'New Follower',
      (SELECT full_name FROM public.profiles WHERE user_id = NEW.follower_id) || ' started following you',
      '/profile/' || NEW.follower_id,
      jsonb_build_object('follower_id', NEW.follower_id)
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE public.profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE user_id = OLD.follower_id;
    
    -- Decrement followers count for followed user
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
END;
$$;

-- Trigger to update counts on follow/unfollow
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.update_follow_counts();