-- Update workspace naming to use "My Workspace" instead of email
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
    -- Create workspace room with simple name
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
    
    -- Add creator as member
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