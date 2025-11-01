-- Add og_image_url column to viral_claims table
ALTER TABLE public.viral_claims 
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add share_count column for analytics
ALTER TABLE public.viral_claims 
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can view certain viral claims" ON public.viral_claims;

-- Create new policy that allows public viewing of shared claims
CREATE POLICY "Anyone can view viral claims"
  ON public.viral_claims
  FOR SELECT
  USING (
    status IN ('verified', 'debunked', 'trending', 'detected') 
    OR share_token IS NOT NULL 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );