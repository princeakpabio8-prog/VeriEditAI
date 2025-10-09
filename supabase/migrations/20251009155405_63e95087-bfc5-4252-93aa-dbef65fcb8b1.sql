-- Create API usage logs table for tracking
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all API usage logs"
  ON public.api_usage_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert logs
CREATE POLICY "Service role can insert API usage logs"
  ON public.api_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own API usage
CREATE POLICY "Users can view their own API usage"
  ON public.api_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.key_hash = api_usage_logs.api_key_hash
      AND api_keys.user_id = auth.uid()
    )
  );

-- Create indexes for efficient queries
CREATE INDEX idx_api_usage_logs_key_created ON public.api_usage_logs(api_key_hash, created_at DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON public.api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);