-- Phase 1: Comment System Implementation (Fixed)

-- 1. Create thread_comments table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'thread_comments') THEN
    CREATE TABLE public.thread_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id UUID NOT NULL REFERENCES public.room_threads(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
      parent_comment_id UUID REFERENCES public.thread_comments(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;

    -- Create indexes
    CREATE INDEX idx_thread_comments_thread_id ON public.thread_comments(thread_id);
    CREATE INDEX idx_thread_comments_author_id ON public.thread_comments(author_id);
    CREATE INDEX idx_thread_comments_parent ON public.thread_comments(parent_comment_id);
  END IF;
END $$;

-- 2. Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can view comments" ON public.thread_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.thread_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.thread_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.thread_comments;

-- Create RLS Policies
CREATE POLICY "Anyone can view comments"
  ON public.thread_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.thread_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON public.thread_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.thread_comments FOR DELETE
  USING (auth.uid() = author_id);

-- 3. Function to update comment count
CREATE OR REPLACE FUNCTION public.update_thread_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comment_total INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO comment_total
  FROM public.thread_comments
  WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id);
  
  UPDATE public.room_threads
  SET comment_count = comment_total,
      updated_at = now()
  WHERE id = COALESCE(NEW.thread_id, OLD.thread_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS thread_comment_insert_trigger ON public.thread_comments;
DROP TRIGGER IF EXISTS thread_comment_delete_trigger ON public.thread_comments;
DROP TRIGGER IF EXISTS thread_comment_updated_at_trigger ON public.thread_comments;

-- Create triggers
CREATE TRIGGER thread_comment_insert_trigger
  AFTER INSERT ON public.thread_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_comment_count();

CREATE TRIGGER thread_comment_delete_trigger
  AFTER DELETE ON public.thread_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_comment_count();

CREATE TRIGGER thread_comment_updated_at_trigger
  BEFORE UPDATE ON public.thread_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();