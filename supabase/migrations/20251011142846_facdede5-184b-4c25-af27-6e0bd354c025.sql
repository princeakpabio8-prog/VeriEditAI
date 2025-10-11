-- Phase 2: Grant Applications Database Table
CREATE TABLE IF NOT EXISTS public.grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  organization_name TEXT,
  funding_amount NUMERIC,
  grant_type TEXT CHECK (grant_type IN ('foundation', 'government', 'corporate', 'other')),
  submission_deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'pending')),
  email_notifications_enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grant applications"
  ON public.grant_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grant applications"
  ON public.grant_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grant applications"
  ON public.grant_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grant applications"
  ON public.grant_applications FOR DELETE
  USING (auth.uid() = user_id);

-- Add email preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "grant_digest": true,
  "grant_reminders": true,
  "partnership_invites": true,
  "verification_complete": true
}'::jsonb;

-- Create index for faster deadline queries
CREATE INDEX IF NOT EXISTS idx_grant_applications_deadline 
  ON public.grant_applications(submission_deadline) 
  WHERE email_notifications_enabled = true AND status IN ('draft', 'pending');

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_grant_applications_user 
  ON public.grant_applications(user_id, created_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_grant_applications_updated_at
  BEFORE UPDATE ON public.grant_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();