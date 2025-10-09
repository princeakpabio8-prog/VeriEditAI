-- Enforce invoker's rights on admin views to respect RLS
ALTER VIEW IF EXISTS public.admin_popular_analytics SET (security_invoker = on);
ALTER VIEW IF EXISTS public.admin_api_usage_stats SET (security_invoker = on);
ALTER VIEW IF EXISTS public.admin_revenue_stats SET (security_invoker = on);
ALTER VIEW IF EXISTS public.payment_logs_summary SET (security_invoker = on);

-- Preserve admin functionality for revenue aggregates by allowing admins to read all payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'Admins can view all payments'
  ) THEN
    CREATE POLICY "Admins can view all payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

COMMENT ON VIEW public.admin_popular_analytics IS 'SECURITY INVOKER: Aggregated API endpoint analytics (RLS enforced on base tables).';
COMMENT ON VIEW public.admin_api_usage_stats IS 'SECURITY INVOKER: API usage stats per key/user (RLS enforced on base tables).';
COMMENT ON VIEW public.admin_revenue_stats IS 'SECURITY INVOKER: Revenue aggregates (admins see global due to payments admin policy; others see own scope per RLS).';
COMMENT ON VIEW public.payment_logs_summary IS 'SECURITY INVOKER: Payment logs summary (only admins can read payment_logs via RLS).';