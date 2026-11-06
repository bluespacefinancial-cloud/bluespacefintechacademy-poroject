-- BlueSPACE LMS — Partner Course slug & summary (017)
-- Adds the columns expected by partner course imports/seeds and by
-- slug-based course lookups. Safe to run multiple times.
--
-- Existing rows get a slug derived from their title; the unique index keeps
-- future inserts from creating ambiguous URLs. The app can still insert
-- courses without a slug (NULL values are allowed and do not conflict).

BEGIN;

ALTER TABLE public.partner_courses
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS slug varchar(220);

COMMENT ON COLUMN public.partner_courses.slug IS 'URL-friendly unique identifier for the course';
COMMENT ON COLUMN public.partner_courses.summary IS 'Short marketing summary shown in course cards';

-- Backfill slugs for rows created before the column existed.
UPDATE public.partner_courses
SET slug = COALESCE(
  NULLIF(trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')), ''),
  'course-' || id
)
WHERE slug IS NULL OR slug = '';

-- Disambiguate courses that share a title (and therefore a base slug).
WITH duplicates AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM public.partner_courses
  WHERE slug IS NOT NULL
)
UPDATE public.partner_courses c
SET slug = c.slug || '-' || c.id
FROM duplicates d
WHERE c.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_courses_slug
  ON public.partner_courses(slug);

COMMIT;
