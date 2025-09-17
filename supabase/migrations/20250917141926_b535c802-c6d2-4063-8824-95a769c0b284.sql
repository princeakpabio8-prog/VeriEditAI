-- Create table for storing image verification results
CREATE TABLE public.image_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL,
  image_url TEXT,
  ocr_text TEXT,
  content_analysis JSONB DEFAULT '{}',
  labels JSONB DEFAULT '[]',
  safe_search JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for image_verifications
CREATE POLICY "Users can view image verifications for their verifications" 
ON public.image_verifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.verifications v 
  WHERE v.id = image_verifications.verification_id 
  AND v.user_id = auth.uid()
));

CREATE POLICY "Users can create image verifications for their verifications" 
ON public.image_verifications 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.verifications v 
  WHERE v.id = image_verifications.verification_id 
  AND v.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_image_verifications_updated_at
BEFORE UPDATE ON public.image_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();