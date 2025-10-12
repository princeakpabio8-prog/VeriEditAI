-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN username TEXT UNIQUE;

-- Add check constraint for username format (3-20 chars, alphanumeric + underscore, lowercase)
ALTER TABLE public.profiles
ADD CONSTRAINT username_format CHECK (
  username ~ '^[a-z0-9_]{3,20}$'
);

-- Create index for fast username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.is_username_available(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE username = LOWER(username_to_check)
  );
$$;

-- Create function to search users by username or name
CREATE OR REPLACE FUNCTION public.search_users(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    username,
    full_name,
    avatar_url
  FROM public.profiles
  WHERE 
    username IS NOT NULL
    AND (
      username ILIKE search_query || '%'
      OR full_name ILIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN username ILIKE search_query || '%' THEN 0 ELSE 1 END,
    followers_count DESC
  LIMIT limit_count;
$$;