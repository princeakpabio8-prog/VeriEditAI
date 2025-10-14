-- Create image_reverse_search_results table for storing reverse image search data
CREATE TABLE image_reverse_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE NOT NULL,
  search_engine TEXT NOT NULL DEFAULT 'google',
  first_seen_date TIMESTAMPTZ,
  oldest_url TEXT,
  total_matches INTEGER DEFAULT 0,
  matching_urls JSONB DEFAULT '[]'::jsonb,
  best_guess_labels JSONB DEFAULT '[]'::jsonb,
  visually_similar_urls JSONB DEFAULT '[]'::jsonb,
  pages_with_matching_images JSONB DEFAULT '[]'::jsonb,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_reverse_search_verification ON image_reverse_search_results(verification_id);
CREATE INDEX idx_reverse_search_engine ON image_reverse_search_results(search_engine);
CREATE INDEX idx_reverse_search_first_seen ON image_reverse_search_results(first_seen_date);

-- Enable RLS
ALTER TABLE image_reverse_search_results ENABLE ROW LEVEL SECURITY;

-- Users can view reverse search results for their own verifications
CREATE POLICY "Users can view their reverse search results"
  ON image_reverse_search_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM verifications v
      WHERE v.id = image_reverse_search_results.verification_id
      AND v.user_id = auth.uid()
    )
  );

-- Public can view reverse search for shared verifications
CREATE POLICY "Public can view reverse search for shared verifications"
  ON image_reverse_search_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM verifications v
      JOIN public_verifications pv ON pv.verification_id = v.id
      WHERE v.id = image_reverse_search_results.verification_id
      AND pv.is_active = true
    )
  );

-- Service role can insert
CREATE POLICY "Service role can insert reverse search"
  ON image_reverse_search_results FOR INSERT
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_reverse_search_updated_at
  BEFORE UPDATE ON image_reverse_search_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();