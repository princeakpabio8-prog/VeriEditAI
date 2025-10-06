-- Add unique constraint on user_id to prevent duplicate subscriber records
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_user_id_key UNIQUE (user_id);

-- Backfill subscribers table with existing users from auth.users
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
SELECT 
  id,
  email,
  true,
  'free'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;