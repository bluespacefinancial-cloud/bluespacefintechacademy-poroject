-- Foundation modules use the shared "All" track. Production databases created
-- before the current schema.sql may still have a two-track constraint.
BEGIN;

ALTER TABLE public.modules
  DROP CONSTRAINT IF EXISTS modules_track_check;

ALTER TABLE public.modules
  ADD CONSTRAINT modules_track_check
  CHECK (track IN ('Finsoft', 'Finops', 'All'));

COMMIT;
