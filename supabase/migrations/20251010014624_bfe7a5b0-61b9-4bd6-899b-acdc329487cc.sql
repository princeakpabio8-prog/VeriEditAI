-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to verifications table
ALTER TABLE verifications 
ADD COLUMN IF NOT EXISTS azure_embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS verifications_embedding_idx 
ON verifications 
USING ivfflat (azure_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create fraud patterns table for known fraud detection
CREATE TABLE IF NOT EXISTS fraud_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  category text NOT NULL, -- 'phishing', 'scam', 'fake_news', 'misinformation'
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  source text, -- Where this pattern was identified
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Create index for fraud pattern similarity search
CREATE INDEX IF NOT EXISTS fraud_patterns_embedding_idx 
ON fraud_patterns 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create embedding cache table for performance
CREATE TABLE IF NOT EXISTS embedding_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash text UNIQUE NOT NULL, -- SHA256 of content
  embedding vector(1536) NOT NULL,
  created_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 0,
  last_accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS embedding_cache_hash_idx ON embedding_cache(content_hash);

-- Enable RLS on fraud_patterns
ALTER TABLE fraud_patterns ENABLE ROW LEVEL SECURITY;

-- Public can read fraud patterns (for detection)
CREATE POLICY "Anyone can view fraud patterns" 
ON fraud_patterns 
FOR SELECT 
USING (true);

-- Only admins can insert/update fraud patterns
CREATE POLICY "Admins can manage fraud patterns" 
ON fraud_patterns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on embedding_cache
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;

-- Service role can manage embedding cache
CREATE POLICY "Service role can manage embedding cache" 
ON embedding_cache 
FOR ALL 
USING (true);

-- Comment on tables
COMMENT ON TABLE fraud_patterns IS 'Known fraud patterns and scam templates for ML-based detection';
COMMENT ON TABLE embedding_cache IS 'Cache for frequently requested embeddings to reduce API costs';
COMMENT ON COLUMN verifications.azure_embedding IS 'Azure OpenAI text-embedding-ada-002 vector (1536 dimensions)';
