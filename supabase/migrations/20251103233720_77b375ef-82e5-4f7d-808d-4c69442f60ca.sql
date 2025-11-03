-- Create unique partial index to prevent duplicate verifications for the same viral claim
-- This ensures only ONE verification can be linked to each unique claim_hash
-- Race condition protection: If two users verify simultaneously, only one will succeed

CREATE UNIQUE INDEX IF NOT EXISTS idx_viral_claims_one_verification_per_hash
ON public.viral_claims(claim_hash) 
WHERE verification_id IS NOT NULL;

COMMENT ON INDEX idx_viral_claims_one_verification_per_hash IS 'Prevents duplicate verifications: only one verification_id allowed per claim_hash';