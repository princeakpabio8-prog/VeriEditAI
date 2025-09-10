-- Add missing INSERT policies for sources and verification_logs tables

-- Fix sources table INSERT policy
CREATE POLICY "Users can create sources for their verifications" 
ON public.sources 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.verifications v 
    WHERE v.id = sources.verification_id 
    AND v.user_id = auth.uid()
  )
);

-- Fix verification_logs table INSERT policy  
CREATE POLICY "Users can create logs for their verifications" 
ON public.verification_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.verifications v 
    WHERE v.id = verification_logs.verification_id 
    AND v.user_id = auth.uid()
  )
);