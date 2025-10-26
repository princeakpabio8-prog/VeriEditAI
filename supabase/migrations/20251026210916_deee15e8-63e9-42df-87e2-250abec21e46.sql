-- Create discovery_beacon_logs table for tracking API indexer submissions
CREATE TABLE IF NOT EXISTS public.discovery_beacon_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indexer_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  response_code INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_beacon_logs_created ON public.discovery_beacon_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beacon_logs_status ON public.discovery_beacon_logs(status);

-- Enable RLS
ALTER TABLE public.discovery_beacon_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view beacon logs
CREATE POLICY "Admins can view beacon logs"
ON public.discovery_beacon_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Policy: System can insert logs (for edge function)
CREATE POLICY "System can insert beacon logs"
ON public.discovery_beacon_logs
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.discovery_beacon_logs IS 'Tracks weekly submissions to AI indexers and API directories';