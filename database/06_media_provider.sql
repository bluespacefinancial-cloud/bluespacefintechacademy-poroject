-- 06_media_provider.sql
--
-- Apply after 05_announcement_admin_reach.sql.
--
-- Media is deliberately provider-neutral:
--
--   auto    - infer from the URL (YouTube links use the YouTube player)
--   youtube - always use the YouTube IFrame player (unlisted lectures)
--   self    - always use a native <video>/<audio> element
--   none    - no playable media for this row
--
-- `auto` keeps every existing row working without a data migration. Explicit
-- values let an author pin the behaviour (for example a self-hosted recording
-- whose URL happens to look like YouTube, or the reverse).
--
-- Only the provider flag is stored here. Video bytes are not stored in the
-- database: lectures stay on YouTube (unlisted) and only audio, captions,
-- thumbnails and short assets are self-hosted, which keeps the API database
-- small and avoids duplicating a transcoding pipeline.

BEGIN;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS media_provider character varying(20) NOT NULL DEFAULT 'auto';

ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_media_provider_check;
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_media_provider_check
  CHECK ((media_provider)::text = ANY (ARRAY['auto'::text, 'youtube'::text, 'self'::text, 'none'::text]));

ALTER TABLE public.partner_course_lessons
  ADD COLUMN IF NOT EXISTS media_provider character varying(20) NOT NULL DEFAULT 'auto';

ALTER TABLE public.partner_course_lessons
  DROP CONSTRAINT IF EXISTS partner_course_lessons_media_provider_check;
ALTER TABLE public.partner_course_lessons
  ADD CONSTRAINT partner_course_lessons_media_provider_check
  CHECK ((media_provider)::text = ANY (ARRAY['auto'::text, 'youtube'::text, 'self'::text, 'none'::text]));

COMMIT;
