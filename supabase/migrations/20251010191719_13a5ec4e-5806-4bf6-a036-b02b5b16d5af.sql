-- Add missing columns to lighthouse_rooms table (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'name') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Room';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'description') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'thread_count') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN thread_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'trust_rating') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN trust_rating NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'is_active') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'created_at') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lighthouse_rooms' AND column_name = 'updated_at') THEN
    ALTER TABLE public.lighthouse_rooms ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- Function to auto-create workspace for new users
CREATE OR REPLACE FUNCTION public.ensure_user_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
  user_name text;
BEGIN
  -- Check if user already has a workspace
  SELECT id INTO workspace_id
  FROM public.lighthouse_rooms
  WHERE creator_id = auth.uid()
  AND room_type = 'workspace'
  LIMIT 1;
  
  -- If no workspace exists, create one
  IF workspace_id IS NULL THEN
    -- Get user's email from auth
    SELECT email INTO user_name
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Create workspace room
    INSERT INTO public.lighthouse_rooms (
      name,
      description,
      room_type,
      category,
      creator_id,
      is_active
    ) VALUES (
      COALESCE(user_name, 'My') || '''s Workspace',
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

-- Trigger to update thread_count when threads are added/removed
CREATE OR REPLACE FUNCTION public.update_room_thread_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lighthouse_rooms
    SET thread_count = thread_count + 1,
        updated_at = now()
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lighthouse_rooms
    SET thread_count = GREATEST(0, thread_count - 1),
        updated_at = now()
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for thread count
DROP TRIGGER IF EXISTS trigger_update_room_thread_count ON public.room_threads;
CREATE TRIGGER trigger_update_room_thread_count
AFTER INSERT OR DELETE ON public.room_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_room_thread_count();

-- Trigger to update member_count when members join/leave
CREATE OR REPLACE FUNCTION public.update_room_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lighthouse_rooms
    SET member_count = member_count + 1,
        updated_at = now()
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lighthouse_rooms
    SET member_count = GREATEST(0, member_count - 1),
        updated_at = now()
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for member count
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON public.room_memberships;
CREATE TRIGGER trigger_update_room_member_count
AFTER INSERT OR DELETE ON public.room_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_room_member_count();