-- Create users profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verifications table for storing verification requests and results
CREATE TABLE public.verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'url', 'file')),
  content TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_summary TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sources table for storing evidence sources
CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content_snippet TEXT,
  reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification_logs table for tracking processing steps
CREATE TABLE public.verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  details JSONB,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for verifications
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

-- Create RLS policies for sources
CREATE POLICY "Users can view sources for their verifications" 
ON public.sources 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.verifications 
    WHERE verifications.id = sources.verification_id 
    AND verifications.user_id = auth.uid()
  )
);

-- Create RLS policies for verification_logs
CREATE POLICY "Users can view logs for their verifications" 
ON public.verification_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.verifications 
    WHERE verifications.id = verification_logs.verification_id 
    AND verifications.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at
BEFORE UPDATE ON public.verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_verifications_user_id ON public.verifications(user_id);
CREATE INDEX idx_verifications_status ON public.verifications(status);
CREATE INDEX idx_verifications_created_at ON public.verifications(created_at DESC);
CREATE INDEX idx_sources_verification_id ON public.sources(verification_id);
CREATE INDEX idx_verification_logs_verification_id ON public.verification_logs(verification_id);