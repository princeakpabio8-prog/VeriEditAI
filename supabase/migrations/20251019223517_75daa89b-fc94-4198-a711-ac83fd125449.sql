-- Create NFT webhook events tracking table
CREATE TABLE IF NOT EXISTS public.nft_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  token_id text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on webhook events
ALTER TABLE public.nft_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events"
ON public.nft_webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert webhook events
CREATE POLICY "Service role can insert webhook events"
ON public.nft_webhook_events
FOR INSERT
WITH CHECK (true);

-- Add index for faster event lookup
CREATE INDEX idx_nft_webhook_events_event_id ON public.nft_webhook_events(event_id);
CREATE INDEX idx_nft_webhook_events_token_id ON public.nft_webhook_events(token_id);

-- Add NFT notification preferences to profiles (if column doesn't exist)
DO $$ 
BEGIN
  -- Update default email_preferences to include NFT notifications
  ALTER TABLE public.profiles 
  ALTER COLUMN email_preferences 
  SET DEFAULT jsonb_build_object(
    'grant_digest', true,
    'grant_reminders', true,
    'partnership_invites', true,
    'verification_complete', true,
    'nft_sales_notifications', true,
    'royalty_alerts', true,
    'listing_updates', false
  );
END $$;

-- Comment for clarity
COMMENT ON TABLE public.nft_webhook_events IS 'Tracks NFT marketplace webhook events from OpenSea and other platforms';