-- Create NFT badges table for Proof of Verification feature
CREATE TABLE public.nft_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 8081,
  metadata_uri TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  wallet_address TEXT NOT NULL,
  
  CONSTRAINT nft_badges_trust_score_check CHECK (trust_score >= 75),
  CONSTRAINT nft_badges_unique_verification UNIQUE(verification_id)
);

-- Create indexes for performance
CREATE INDEX idx_nft_badges_user_id ON public.nft_badges(user_id);
CREATE INDEX idx_nft_badges_verification_id ON public.nft_badges(verification_id);
CREATE INDEX idx_nft_badges_wallet_address ON public.nft_badges(wallet_address);

-- Enable Row Level Security
ALTER TABLE public.nft_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
CREATE POLICY "Users can view their own badges"
  ON public.nft_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert badges (via edge function)
CREATE POLICY "Service role can insert badges"
  ON public.nft_badges FOR INSERT
  WITH CHECK (auth.role() = 'service_role');