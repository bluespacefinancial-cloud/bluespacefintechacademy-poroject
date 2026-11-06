-- Keep application answers specific to the applicant's selected role.
BEGIN;

ALTER TABLE public.academy_applications
  ADD COLUMN IF NOT EXISTS website varchar(500),
  ADD COLUMN IF NOT EXISTS teaching_domains text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS teaching_experience text,
  ADD COLUMN IF NOT EXISTS partnership_focus varchar(60),
  ADD COLUMN IF NOT EXISTS partnership_details text;

COMMIT;
