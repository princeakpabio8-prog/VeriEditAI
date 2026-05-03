CREATE TABLE IF NOT EXISTS public.truth_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_number serial UNIQUE,
  status text NOT NULL DEFAULT 'whitelisted',
  wallet_address text,
  discord_username text,
  discord_verified_at timestamptz,
  nft_token_id text,
  nft_tx_hash text,
  payment_tx_hash text NOT NULL,
  payment_amount_usd numeric(10,2) NOT NULL DEFAULT 4.99,
  payment_currency text NOT NULL,
  payment_chain_id integer NOT NULL DEFAULT 137,
  active_since timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_truth_badges_user ON public.truth_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_truth_badges_wallet ON public.truth_badges(lower(wallet_address));

CREATE TABLE IF NOT EXISTS public.truth_badge_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_hash text NOT NULL UNIQUE,
  chain_id integer NOT NULL DEFAULT 137,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.truth_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truth_badge_payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own truth badge" ON public.truth_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all truth badges" ON public.truth_badges FOR SELECT USING (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage truth badges" ON public.truth_badges FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users update own truth badge" ON public.truth_badges FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own payment attempts" ON public.truth_badge_payment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payment attempts" ON public.truth_badge_payment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage payment attempts" ON public.truth_badge_payment_attempts FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER update_truth_badges_updated_at BEFORE UPDATE ON public.truth_badges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_truth_badge_holder(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.truth_badges WHERE user_id = _user_id);
$$;