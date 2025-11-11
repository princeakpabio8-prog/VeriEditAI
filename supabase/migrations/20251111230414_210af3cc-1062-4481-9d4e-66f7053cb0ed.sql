-- Add 'enterprise' value to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'enterprise' 
        AND enumtypid = 'public.app_role'::regtype
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'enterprise';
    END IF;
END $$;