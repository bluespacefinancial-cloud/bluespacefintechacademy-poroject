-- Completion workflows: certificate verification and operational notifications.
-- Run after migrations 001-006.

ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS certificate_number varchar(80),
  ADD COLUMN IF NOT EXISTS verification_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certifications_certificate_number
  ON public.certifications (certificate_number)
  WHERE certificate_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_certifications_verification_token
  ON public.certifications (verification_token)
  WHERE verification_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_token uuid)
RETURNS TABLE (
  certificate_number varchar,
  track varchar,
  issued_at timestamptz,
  fellow_name varchar,
  cohort_name varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.certificate_number, c.track, c.issued_at, u.name, h.name
  FROM public.certifications c
  JOIN public.users u ON u.id = c.user_id
  JOIN public.cohorts h ON h.id = c.cohort_id
  WHERE c.verification_token = p_token
    AND c.status = 'certified'
    AND c.revoked_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.issue_certificate(p_certification_id bigint)
RETURNS public.certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.certifications;
BEGIN
  IF public.current_profile_role() NOT IN ('Instructor', 'Administrator') THEN
    RAISE EXCEPTION 'Only academy staff can issue certificates';
  END IF;
  UPDATE public.certifications
  SET status = 'certified',
      certificate_number = COALESCE(certificate_number, 'BSA-' || to_char(now(), 'YYYY') || '-' || lpad(id::text, 6, '0')),
      verification_token = COALESCE(verification_token, gen_random_uuid()),
      issued_at = COALESCE(issued_at, now()),
      updated_at = now()
  WHERE id = p_certification_id
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Certification not found'; END IF;
  RETURN result;
END;
$$;
