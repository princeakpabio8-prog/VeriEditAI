-- Create activity stream table for tracking live platform activities
CREATE TABLE IF NOT EXISTS public.activity_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'verification_complete',
    'thread_created',
    'room_created',
    'room_joined',
    'comment_posted',
    'high_trust_score',
    'user_follow'
  )),
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_activity_stream_created_at ON public.activity_stream(created_at DESC);
CREATE INDEX idx_activity_stream_type ON public.activity_stream(activity_type);
CREATE INDEX idx_activity_stream_user ON public.activity_stream(user_id);

-- Enable RLS
ALTER TABLE public.activity_stream ENABLE ROW LEVEL SECURITY;

-- Anyone can view activity stream
CREATE POLICY "Anyone can view activity stream"
  ON public.activity_stream
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own activities
CREATE POLICY "Users can insert their own activities"
  ON public.activity_stream
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_stream;

-- Function to clean old activities (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_stream
  WHERE created_at < now() - interval '24 hours';
END;
$$;