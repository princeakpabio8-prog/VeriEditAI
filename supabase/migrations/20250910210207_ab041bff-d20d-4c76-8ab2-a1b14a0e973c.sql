-- Create payment_logs table for webhook audit trail
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  signature TEXT,
  event_type TEXT,
  tx_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed', 'invalid_signature')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_logs (admin access only)
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system access only
CREATE POLICY "System can manage payment logs" 
ON public.payment_logs 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_payment_logs_tx_ref ON public.payment_logs(tx_ref);
CREATE INDEX idx_payment_logs_status ON public.payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON public.payment_logs(created_at);