-- Add share_token column to viral_claims table for easy sharing of verified claims
ALTER TABLE viral_claims 
ADD COLUMN share_token TEXT;

-- Create index for efficient lookups by share_token
CREATE INDEX idx_viral_claims_share_token ON viral_claims(share_token);