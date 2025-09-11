-- Fix linter ERROR 0010: Mark views as security_invoker so they do not bypass RLS via owner privileges
-- This preserves RLS behavior and eliminates the security-definer view issue

-- Ensure the view exists first (no-op if it already does)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v' AND n.nspname = 'public' AND c.relname = 'payment_logs_summary'
  ) THEN
    -- Set the view to run with the querying user's permissions
    EXECUTE 'ALTER VIEW public.payment_logs_summary SET (security_invoker = on)';
  END IF;
END $$;

-- Optional: document the rationale
COMMENT ON VIEW public.payment_logs_summary IS 'Runs with security_invoker=on so it respects caller RLS; exposes only basic, non-sensitive payment status fields.';