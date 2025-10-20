-- Phase 1: Enable Real-Time for Lighthouse Tables

-- Add REPLICA IDENTITY FULL for real-time updates
ALTER TABLE lighthouse_rooms REPLICA IDENTITY FULL;
ALTER TABLE room_threads REPLICA IDENTITY FULL;
ALTER TABLE news_feed REPLICA IDENTITY FULL;
ALTER TABLE viral_claims REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE lighthouse_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE news_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE viral_claims;