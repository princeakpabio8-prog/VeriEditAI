-- Create ritual_witnesses table for community witness system
CREATE TABLE IF NOT EXISTS ritual_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES room_threads(id) ON DELETE CASCADE,
  witness_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  witnessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  witness_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, witness_user_id)
);

-- Add RLS policies
ALTER TABLE ritual_witnesses ENABLE ROW LEVEL SECURITY;

-- Anyone can view witnesses
CREATE POLICY "Anyone can view ritual witnesses"
  ON ritual_witnesses FOR SELECT
  TO authenticated
  USING (true);

-- Users can become witnesses
CREATE POLICY "Users can witness rituals"
  ON ritual_witnesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = witness_user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ritual_witnesses_thread 
  ON ritual_witnesses(thread_id);

CREATE INDEX IF NOT EXISTS idx_ritual_witnesses_user 
  ON ritual_witnesses(witness_user_id);