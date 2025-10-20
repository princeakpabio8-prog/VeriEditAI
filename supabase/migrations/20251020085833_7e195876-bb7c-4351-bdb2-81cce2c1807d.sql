-- Add og_image_url column to room_threads for dynamic OG images
ALTER TABLE room_threads 
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add og_image_url column to lighthouse_rooms for dynamic OG images
ALTER TABLE lighthouse_rooms 
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_room_threads_og_image ON room_threads(og_image_url) WHERE og_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lighthouse_rooms_og_image ON lighthouse_rooms(og_image_url) WHERE og_image_url IS NOT NULL;

COMMENT ON COLUMN room_threads.og_image_url IS 'Dynamically generated Open Graph image URL for social sharing';
COMMENT ON COLUMN lighthouse_rooms.og_image_url IS 'Dynamically generated Open Graph image URL for social sharing';