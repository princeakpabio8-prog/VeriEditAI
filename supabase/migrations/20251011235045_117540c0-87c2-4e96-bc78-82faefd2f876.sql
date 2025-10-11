-- Add Truth Garden spatial coordinates to room_threads
ALTER TABLE room_threads 
ADD COLUMN IF NOT EXISTS garden_position_x NUMERIC DEFAULT (random() * 20 - 10),
ADD COLUMN IF NOT EXISTS garden_position_z NUMERIC DEFAULT (random() * 20 - 10),
ADD COLUMN IF NOT EXISTS tree_growth_stage INTEGER DEFAULT 1;

-- Add index for garden queries
CREATE INDEX IF NOT EXISTS idx_room_threads_garden 
ON room_threads(room_id, garden_position_x, garden_position_z);