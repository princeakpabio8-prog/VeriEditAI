-- Allow authenticated users to view profiles of thread authors in public/workspace rooms
-- This fixes the issue where thread author names couldn't be displayed in public rooms
CREATE POLICY "Users can view profiles of thread authors in public rooms"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_threads rt
    INNER JOIN public.lighthouse_rooms lr ON lr.id = rt.room_id
    WHERE rt.author_id = profiles.user_id
      AND lr.room_type IN ('public', 'workspace')
  )
);