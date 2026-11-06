-- Workflow automation and staff review support.
-- Run after migrations 001-007.

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id bigint,
  p_type text,
  p_data text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (p_user_id, p_type, p_data);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_submission_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_id bigint;
BEGIN
  IF NEW.status = 'submitted' THEN
    FOR staff_id IN SELECT id FROM public.users WHERE type IN ('Instructor', 'Administrator') AND is_active = 1 LOOP
      PERFORM public.create_notification(staff_id, 'New submission', 'A student submitted work for review.');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_submission_graded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('passed', 'remediation', 'failed', 'graded') THEN
    PERFORM public.create_notification(NEW.user_id, 'Grade updated', 'Your submission has been reviewed. Open Grading or My Learning for feedback.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_clinic_booked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clinic_title text;
BEGIN
  SELECT title INTO clinic_title FROM public.clinics WHERE id = NEW.clinic_id;
  PERFORM public.create_notification(NEW.user_id, 'Clinic booking confirmed', 'Your booking for ' || COALESCE(clinic_title, 'mentor clinic') || ' is confirmed.');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_submission_created_trigger ON public.submissions;
CREATE TRIGGER notify_submission_created_trigger
  AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_created();

DROP TRIGGER IF EXISTS notify_submission_graded_trigger ON public.submissions;
CREATE TRIGGER notify_submission_graded_trigger
  AFTER UPDATE OF status ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_graded();

DROP TRIGGER IF EXISTS notify_clinic_booked_trigger ON public.clinic_bookings;
CREATE TRIGGER notify_clinic_booked_trigger
  AFTER INSERT ON public.clinic_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_clinic_booked();

CREATE OR REPLACE FUNCTION public.review_sprint_deliverable(
  p_deliverable_id bigint,
  p_score int,
  p_feedback text,
  p_status varchar
)
RETURNS public.sprint_deliverables
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.sprint_deliverables;
  reviewer_id bigint;
BEGIN
  reviewer_id := public.current_profile_id();
  IF public.current_profile_role() NOT IN ('Instructor', 'Administrator') THEN
    RAISE EXCEPTION 'Only academy staff can review deliverables';
  END IF;
  IF p_status NOT IN ('accepted', 'remediation') OR p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Invalid review status or score';
  END IF;
  UPDATE public.sprint_deliverables
  SET score = p_score, feedback = p_feedback, status = p_status,
      reviewed_by = reviewer_id, reviewed_at = now(), updated_at = now()
  WHERE id = p_deliverable_id
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Deliverable not found'; END IF;
  PERFORM public.create_notification(result.user_id, 'Project deliverable reviewed', 'Your sprint deliverable has been reviewed.');
  RETURN result;
END;
$$;
