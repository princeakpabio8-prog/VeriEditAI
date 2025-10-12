-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;