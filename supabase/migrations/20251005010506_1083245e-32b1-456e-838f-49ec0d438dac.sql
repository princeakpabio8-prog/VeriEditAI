-- Create verification feedback table for user ratings
CREATE TABLE IF NOT EXISTS public.verification_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.verification_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.verification_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
ON public.verification_feedback
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
ON public.verification_feedback
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_verification_feedback_user_id ON public.verification_feedback(user_id);
CREATE INDEX idx_verification_feedback_verification_id ON public.verification_feedback(verification_id);

-- Add trigger for updated_at
CREATE TRIGGER update_verification_feedback_updated_at
BEFORE UPDATE ON public.verification_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add score breakdown fields to verifications table
ALTER TABLE public.verifications 
ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb;