-- 11_partner_media_and_lessons.sql
--
-- Bridge schema and storage requirements for partners to upload courses,
-- video files, audio files, captions, thumbnails, and external URLs.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add missing columns to partner_course_lessons
-- ---------------------------------------------------------------------------

ALTER TABLE public.partner_course_lessons
  ADD COLUMN IF NOT EXISTS type character varying(20) DEFAULT 'video' NOT NULL,
  ADD COLUMN IF NOT EXISTS media_provider character varying(50) DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS audio_url character varying(500),
  ADD COLUMN IF NOT EXISTS thumbnail_url character varying(500),
  ADD COLUMN IF NOT EXISTS caption_url character varying(500),
  ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_course_lessons_type_check'
  ) THEN
    ALTER TABLE public.partner_course_lessons
      ADD CONSTRAINT partner_course_lessons_type_check
      CHECK (type IN ('video', 'audio', 'text'));
  END IF;
END $$;

-- Populate existing rows with sensible defaults
UPDATE public.partner_course_lessons
   SET type = 'video',
       media_provider = CASE
         WHEN video_url ILIKE '%youtube%' OR video_url ILIKE '%youtu.be%' THEN 'youtube'
         WHEN video_url ILIKE '%vimeo%' THEN 'vimeo'
         WHEN video_url IS NOT NULL AND video_url <> '' THEN 'self'
         ELSE 'none'
       END
 WHERE type IS NULL OR type = 'video';

-- Grant column permissions to standard roles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.partner_course_lessons TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Enhanced current_partner_id() lookup
-- ---------------------------------------------------------------------------
-- Allows partners to be identified by either users.partner_id or partners.created_by.
-- Also allows Administrators to inspect partner context if needed.

CREATE OR REPLACE FUNCTION public.current_partner_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT partner_id FROM public.users WHERE id = public.current_profile_id() AND type = 'Partner' LIMIT 1),
    (SELECT id FROM public.partners WHERE created_by = public.current_profile_id() LIMIT 1)
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_partner_id() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Storage buckets for media, videos, audio, thumbnails, and captions
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'media',
    'media',
    true,
    524288000, -- 500 MB
    ARRAY[
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'text/vtt', 'text/srt', 'text/plain', 'application/pdf'
    ]
  ),
  (
    'videos',
    'videos',
    true,
    524288000, -- 500 MB
    ARRAY[
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/vnd.apple.mpegurl', 'video/mp2t'
    ]
  ),
  (
    'audio',
    'audio',
    true,
    104857600, -- 100 MB
    ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4']
  ),
  (
    'thumbnails',
    'thumbnails',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'captions',
    'captions',
    true,
    5242880, -- 5 MB
    ARRAY['text/vtt', 'text/srt', 'text/plain']
  )
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 4. Storage RLS policies for unified 'media' bucket
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Media is publicly readable" ON storage.objects;
CREATE POLICY "Media is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = owner::text
  );

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = owner::text
  );

-- Also ensure Administrators can delete/update any media/video if needed for moderation
DROP POLICY IF EXISTS "Administrators can manage all media objects" ON storage.objects;
CREATE POLICY "Administrators can manage all media objects"
  ON storage.objects FOR ALL
  USING (
    (public.current_profile_role())::text = 'Administrator'
  )
  WITH CHECK (
    (public.current_profile_role())::text = 'Administrator'
  );

COMMIT;
