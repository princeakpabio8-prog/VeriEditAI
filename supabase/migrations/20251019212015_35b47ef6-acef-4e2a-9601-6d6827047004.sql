-- Add OpenSea tracking columns to nft_badges
ALTER TABLE public.nft_badges 
ADD COLUMN IF NOT EXISTS opensea_listed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS opensea_url text,
ADD COLUMN IF NOT EXISTS last_sale_price numeric,
ADD COLUMN IF NOT EXISTS current_listing_price numeric,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create collection stats table
CREATE TABLE IF NOT EXISTS public.nft_collection_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_volume numeric DEFAULT 0,
  floor_price numeric DEFAULT 0,
  owners_count integer DEFAULT 0,
  listed_count integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  average_price numeric DEFAULT 0,
  last_synced_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create royalty earnings tracking table
CREATE TABLE IF NOT EXISTS public.nft_royalty_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL,
  sale_price numeric NOT NULL,
  royalty_amount numeric NOT NULL,
  royalty_percentage numeric NOT NULL DEFAULT 5,
  seller_address text NOT NULL,
  buyer_address text NOT NULL,
  transaction_hash text NOT NULL UNIQUE,
  platform text DEFAULT 'opensea',
  earned_at timestamptz DEFAULT now(),
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create marketplace listings table
CREATE TABLE IF NOT EXISTS public.nft_marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL,
  badge_id uuid REFERENCES public.nft_badges(id) ON DELETE CASCADE,
  seller_address text NOT NULL,
  listing_price numeric NOT NULL,
  currency text DEFAULT 'MATIC',
  platform text DEFAULT 'opensea',
  listing_url text,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nft_collection_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_royalty_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_marketplace_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection stats (public read)
CREATE POLICY "Anyone can view collection stats"
ON public.nft_collection_stats FOR SELECT
USING (true);

CREATE POLICY "Service role can manage collection stats"
ON public.nft_collection_stats FOR ALL
USING (true);

-- RLS Policies for royalty earnings (admin only)
CREATE POLICY "Admins can view royalty earnings"
ON public.nft_royalty_earnings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage royalty earnings"
ON public.nft_royalty_earnings FOR ALL
USING (true);

-- RLS Policies for marketplace listings
CREATE POLICY "Anyone can view active listings"
ON public.nft_marketplace_listings FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can manage their own listings"
ON public.nft_marketplace_listings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.nft_badges
    WHERE nft_badges.id = nft_marketplace_listings.badge_id
    AND nft_badges.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all listings"
ON public.nft_marketplace_listings FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_nft_badges_opensea ON public.nft_badges(opensea_listed) WHERE opensea_listed = true;
CREATE INDEX idx_royalty_token ON public.nft_royalty_earnings(token_id);
CREATE INDEX idx_royalty_earned_at ON public.nft_royalty_earnings(earned_at DESC);
CREATE INDEX idx_royalty_claimed ON public.nft_royalty_earnings(claimed) WHERE claimed = false;
CREATE INDEX idx_marketplace_active ON public.nft_marketplace_listings(is_active) WHERE is_active = true;
CREATE INDEX idx_marketplace_token ON public.nft_marketplace_listings(token_id);

-- Insert initial collection stats record
INSERT INTO public.nft_collection_stats (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;