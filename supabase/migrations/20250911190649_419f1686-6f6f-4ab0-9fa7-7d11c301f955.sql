-- Add RLS policies to payment_logs_summary table
ALTER TABLE public.payment_logs_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for admin-only access to payment logs summary
CREATE POLICY "Admin access only" 
ON public.payment_logs_summary 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));