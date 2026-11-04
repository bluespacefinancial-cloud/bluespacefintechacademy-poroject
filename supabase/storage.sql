-- =============================================================
-- BlueSPACE Fintech Academy LMS: Supabase Storage Buckets
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- =============================================================

-- Enable storage extension if not already enabled
-- Note: In Supabase, storage is typically managed via the Dashboard UI
-- but we can also create buckets via SQL using the storage schema

-- Insert storage buckets (Supabase manages these via the storage schema)
-- These buckets should also be created via Supabase Dashboard > Storage
-- with appropriate public/private settings and RLS policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'application/vnd.apple.mpegurl', 'video/mp2t']),
  ('audio', 'audio', true, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4']),
  ('captions', 'captions', true, 1048576, ARRAY['text/vtt', 'text/srt']),
  ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies (RLS)
-- These policies allow authenticated users to upload/download their own files
-- and allow public read access to video/audio content

-- Videos bucket: public read, authenticated upload
CREATE POLICY "Videos are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = owner::text);

CREATE POLICY "Users can delete own videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = owner::text);

-- Audio bucket: public read, authenticated upload
CREATE POLICY "Audio is publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own audio" ON storage.objects
  FOR UPDATE USING (bucket_id = 'audio' AND auth.uid()::text = owner::text);

CREATE POLICY "Users can delete own audio" ON storage.objects
  FOR DELETE USING (bucket_id = 'audio' AND auth.uid()::text = owner::text);

-- Captions bucket: public read, authenticated upload
CREATE POLICY "Captions are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'captions');

CREATE POLICY "Authenticated users can upload captions" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'captions' AND auth.role() = 'authenticated');

-- Thumbnails bucket: public read, authenticated upload
CREATE POLICY "Thumbnails are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- =============================================================
-- Note: If storage.buckets table doesn't exist in your Supabase project,
-- create the buckets via Supabase Dashboard > Storage instead:
--   1. Go to Storage > Buckets
--   2. Create bucket: videos (public)
--   3. Create bucket: audio (public)
--   4. Create bucket: captions (public)
--   5. Create bucket: thumbnails (public)
--   6. Set RLS policies as shown above
-- =============================================================
