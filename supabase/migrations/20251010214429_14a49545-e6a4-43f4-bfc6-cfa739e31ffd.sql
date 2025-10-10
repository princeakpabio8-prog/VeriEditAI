-- Fix 1: Recalculate and sync all thread counts
UPDATE lighthouse_rooms lr
SET thread_count = (
  SELECT COUNT(*)
  FROM room_threads rt
  WHERE rt.room_id = lr.id 
  AND rt.status = 'active'
),
updated_at = now();

-- Fix 2: Recalculate and sync all member counts
UPDATE lighthouse_rooms lr
SET member_count = (
  SELECT COUNT(*)
  FROM room_memberships rm
  WHERE rm.room_id = lr.id
),
updated_at = now();

-- Fix 3: Add missing creator memberships for existing rooms
INSERT INTO room_memberships (room_id, user_id, role)
SELECT lr.id, lr.creator_id, 'owner'
FROM lighthouse_rooms lr
WHERE NOT EXISTS (
  SELECT 1 FROM room_memberships rm
  WHERE rm.room_id = lr.id AND rm.user_id = lr.creator_id
)
ON CONFLICT DO NOTHING;

-- Fix 4: Update ensure_user_workspace function to auto-add creator as member
CREATE OR REPLACE FUNCTION public.ensure_user_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_id uuid;
BEGIN
  -- Check if user already has a workspace
  SELECT id INTO workspace_id
  FROM public.lighthouse_rooms
  WHERE creator_id = auth.uid()
  AND room_type = 'workspace'
  LIMIT 1;
  
  -- If no workspace exists, create one
  IF workspace_id IS NULL THEN
    -- Create workspace room
    INSERT INTO public.lighthouse_rooms (
      name,
      description,
      room_type,
      category,
      creator_id,
      is_active
    ) VALUES (
      'My Workspace',
      'Private workspace for organizing verification threads and collaborating with contributors',
      'workspace',
      'general',
      auth.uid(),
      true
    ) RETURNING id INTO workspace_id;
    
    -- CRITICAL: Add creator as owner member
    INSERT INTO public.room_memberships (
      room_id,
      user_id,
      role
    ) VALUES (
      workspace_id,
      auth.uid(),
      'owner'
    );
  END IF;
  
  RETURN workspace_id;
END;
$$;