-- Priority 3: Cleanup unused columns from thread_comments table
ALTER TABLE public.thread_comments
DROP COLUMN IF EXISTS upvote_count,
DROP COLUMN IF EXISTS is_verified_contributor;