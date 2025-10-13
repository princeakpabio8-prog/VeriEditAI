-- Add columns for activity digest and badges to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_digest_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Create index for faster badge queries
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON public.profiles USING GIN(badges);