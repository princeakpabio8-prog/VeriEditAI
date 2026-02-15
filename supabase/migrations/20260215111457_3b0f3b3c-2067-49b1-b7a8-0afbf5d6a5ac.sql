-- Allow room creators to delete their own rooms
CREATE POLICY "Room creators can delete their rooms"
ON public.lighthouse_rooms
FOR DELETE
USING (auth.uid() = creator_id);

-- Allow thread authors to delete their own threads
CREATE POLICY "Thread authors can delete their threads"
ON public.room_threads
FOR DELETE
USING (auth.uid() = author_id);

-- Allow room creators to delete any thread in their room
CREATE POLICY "Room owners can delete threads in their rooms"
ON public.room_threads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lighthouse_rooms
    WHERE id = room_threads.room_id
    AND creator_id = auth.uid()
  )
);

-- Allow room creators to delete memberships in their rooms
CREATE POLICY "Room owners can delete memberships"
ON public.room_memberships
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.lighthouse_rooms
    WHERE id = room_memberships.room_id
    AND creator_id = auth.uid()
  )
);

-- Allow room creators to delete comments in threads of their rooms
CREATE POLICY "Room owners can delete comments in their rooms"
ON public.thread_comments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.room_threads rt
    JOIN public.lighthouse_rooms lr ON lr.id = rt.room_id
    WHERE rt.id = thread_comments.thread_id
    AND lr.creator_id = auth.uid()
  )
);
