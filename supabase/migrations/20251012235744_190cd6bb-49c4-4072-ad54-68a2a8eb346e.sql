-- Create storage bucket for OG images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images',
  'og-images',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg']
);

-- Storage policies for og-images bucket
CREATE POLICY "Anyone can view OG images"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

CREATE POLICY "Service role can upload OG images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'og-images');

CREATE POLICY "Service role can update OG images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'og-images');

CREATE POLICY "Service role can delete old OG images"
ON storage.objects FOR DELETE
USING (bucket_id = 'og-images');

-- Add platform_stats to public_verifications
ALTER TABLE public.public_verifications
ADD COLUMN IF NOT EXISTS platform_stats jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0;

-- Create public_threads table for shareable threads
CREATE TABLE IF NOT EXISTS public.public_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.room_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  share_token text UNIQUE NOT NULL,
  og_title text,
  og_description text,
  og_image_url text,
  view_count integer DEFAULT 0 NOT NULL,
  share_count integer DEFAULT 0 NOT NULL,
  platform_stats jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on public_threads
ALTER TABLE public.public_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_threads
CREATE POLICY "Public can view active thread shares"
ON public.public_threads FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can create thread shares"
ON public.public_threads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_threads
    WHERE room_threads.id = public_threads.thread_id
    AND room_threads.author_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their thread shares"
ON public.public_threads FOR ALL
USING (user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_threads_token ON public.public_threads(share_token);
CREATE INDEX IF NOT EXISTS idx_public_threads_thread_id ON public.public_threads(thread_id);

-- Create share_analytics table for tracking
CREATE TABLE IF NOT EXISTS public.share_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'verification' or 'thread'
  content_id uuid NOT NULL,
  share_token text NOT NULL,
  platform text NOT NULL, -- 'twitter', 'facebook', 'linkedin', 'whatsapp', 'copy'
  user_id uuid,
  ip_address inet,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on share_analytics
ALTER TABLE public.share_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_analytics
CREATE POLICY "Service role can insert share analytics"
ON public.share_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own share analytics"
ON public.share_analytics FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all share analytics"
ON public.share_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_share_analytics_content ON public.share_analytics(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_platform ON public.share_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_share_analytics_created_at ON public.share_analytics(created_at DESC);