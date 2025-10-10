-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to verifications table
ALTER TABLE verifications 
ADD COLUMN IF NOT EXISTS azure_embedding vector(1536);

-- Create index for fast similarity search (drop if exists first)
DROP INDEX IF EXISTS verifications_embedding_idx;
CREATE INDEX verifications_embedding_idx 
ON verifications 
USING ivfflat (azure_embedding vector_cosine_ops)
WITH (lists = 100);

-- Comment on column
COMMENT ON COLUMN verifications.azure_embedding IS 'Azure OpenAI text-embedding-ada-002 vector (1536 dimensions)';
