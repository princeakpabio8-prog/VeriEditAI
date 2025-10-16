-- Create analytics audit table for data integrity tracking
CREATE TABLE IF NOT EXISTS public.analytics_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  reported_value NUMERIC,
  actual_value NUMERIC,
  discrepancy NUMERIC,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  is_accurate BOOLEAN,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.analytics_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view analytics audit"
  ON public.analytics_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert analytics audit"
  ON public.analytics_audit
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_analytics_audit_metric_type ON public.analytics_audit(metric_type);
CREATE INDEX idx_analytics_audit_checked_at ON public.analytics_audit(checked_at DESC);