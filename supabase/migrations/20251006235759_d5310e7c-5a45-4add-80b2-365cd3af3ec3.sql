-- Create public_verifications table for shareable verification reports
CREATE TABLE public.public_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- SEO & Social Media metadata
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT
);

-- Create indexes for performance
CREATE INDEX idx_public_verifications_token ON public.public_verifications(share_token);
CREATE INDEX idx_public_verifications_user ON public.public_verifications(user_id);
CREATE INDEX idx_public_verifications_verification ON public.public_verifications(verification_id);

-- Enable Row Level Security
ALTER TABLE public.public_verifications ENABLE ROW LEVEL SECURITY;

-- Users can create shares for their own verifications
CREATE POLICY "Users can create public shares"
  ON public.public_verifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.verifications 
      WHERE id = verification_id AND user_id = auth.uid()
    )
  );

-- Users can view and manage their own shares
CREATE POLICY "Users can manage their shares"
  ON public.public_verifications FOR ALL
  USING (user_id = auth.uid());

-- Public can view active shares (this allows unauthenticated access!)
CREATE POLICY "Public can view active shares"
  ON public.public_verifications FOR SELECT
  USING (is_active = true);

-- Allow public read access to verifications that have been shared
CREATE POLICY "Public can view shared verifications"
  ON public.verifications FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.public_verifications 
      WHERE verification_id = verifications.id 
      AND is_active = true
    )
  );

-- Allow public read access to sources for shared verifications
CREATE POLICY "Public can view sources for shared verifications"
  ON public.sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.verifications v
      WHERE v.id = sources.verification_id 
      AND (
        v.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.public_verifications pv
          WHERE pv.verification_id = v.id 
          AND pv.is_active = true
        )
      )
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_public_verifications_updated_at
  BEFORE UPDATE ON public.public_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();