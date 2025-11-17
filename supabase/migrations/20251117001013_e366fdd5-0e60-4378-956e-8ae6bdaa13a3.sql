-- Delete all duplicate licenses except the most recent one per user
DELETE FROM public.licenses
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.licenses
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint on user_id
ALTER TABLE public.licenses
ADD CONSTRAINT licenses_user_id_key UNIQUE (user_id);