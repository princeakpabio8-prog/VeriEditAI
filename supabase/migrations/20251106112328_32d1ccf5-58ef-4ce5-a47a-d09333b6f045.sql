-- Allow everyone (including unauthenticated users) to view viral claims
-- This enables the Hot Claims feed to work for all visitors

-- Enable RLS on viral_claims if not already enabled
ALTER TABLE public.viral_claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view viral claims" ON public.viral_claims;
DROP POLICY IF EXISTS "Public can view active viral claims" ON public.viral_claims;

-- Create new public read policy
CREATE POLICY "Anyone can view viral claims"
ON public.viral_claims
FOR SELECT
TO public
USING (true);

-- Service role can manage all viral claims
CREATE POLICY "Service role can manage viral claims"
ON public.viral_claims
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Anyone can view viral claims" ON public.viral_claims IS 'Allows all users (authenticated and unauthenticated) to view viral claims for the Hot Claims feed';