-- Fix RLS policies for verifications table to allow authenticated users to insert and read their own verifications

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.verifications;
DROP POLICY IF EXISTS "Users can create their own verifications" ON public.verifications;
DROP POLICY IF EXISTS "Users can update their own verifications" ON public.verifications;

-- Enable RLS on verifications table
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for verifications table
CREATE POLICY "Users can view their own verifications" 
ON public.verifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications" 
ON public.verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications" 
ON public.verifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Also fix any missing RLS policies for related tables

-- Sources table policies
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sources for their verifications" ON public.sources;
CREATE POLICY "Users can view sources for their verifications" 
ON public.sources 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.verifications v 
    WHERE v.id = sources.verification_id 
    AND v.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create sources for their verifications" ON public.sources;
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

-- Verification logs table policies
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs for their verifications" ON public.verification_logs;
CREATE POLICY "Users can view logs for their verifications" 
ON public.verification_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.verifications v 
    WHERE v.id = verification_logs.verification_id 
    AND v.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create logs for their verifications" ON public.verification_logs;
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

-- Subscribers table policies (already exist but making sure)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
CREATE POLICY "Users can insert their own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);