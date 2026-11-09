-- BlueSPACE LMS public schema, data, grants and row-level security.
-- Generated from the verified academy database. Applied after 00_bootstrap.sql.
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: assign_partner_user(bigint, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_partner_user(p_user_id bigint, p_partner_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF public.current_profile_role() <> 'Administrator' THEN
    RAISE EXCEPTION 'Only administrators can assign partner accounts';
  END IF;
  UPDATE public.users SET partner_id = p_partner_id, updated_at = now()
  WHERE id = p_user_id AND type = 'Partner';
  IF NOT FOUND THEN RAISE EXCEPTION 'Partner user not found'; END IF;
END;
$$;


--
-- Name: clear_my_force_password_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clear_my_force_password_change() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.users
  SET force_password_change = 0, updated_at = now()
  WHERE id = public.current_profile_id();
$$;


--
-- Name: create_notification(bigint, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_notification(p_user_id bigint, p_type text, p_data text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (p_user_id, p_type, p_data);
END;
$$;


--
-- Name: current_partner_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_partner_id() RETURNS bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT partner_id FROM public.users
  WHERE id = public.current_profile_id() AND type = 'Partner'
  LIMIT 1;
$$;


--
-- Name: current_profile_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_profile_id() RETURNS bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT id::bigint FROM public.users
      WHERE is_active = 1
        AND (
          auth_user_id = auth.uid()
          OR (auth_user_id IS NULL AND lower(email) = lower(auth.email()))
        )
      LIMIT 1;
    $$;


--
-- Name: current_profile_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_profile_role() RETURNS character varying
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT type::character varying FROM public.users
      WHERE is_active = 1
        AND (
          auth_user_id = auth.uid()
          OR (auth_user_id IS NULL AND lower(email) = lower(auth.email()))
        )
      LIMIT 1;
    $$;


--
-- Name: current_squad_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_squad_ids() RETURNS SETOF bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT squad_id::bigint
      FROM public.enrolments
      WHERE user_id = public.current_profile_id()
        AND squad_id IS NOT NULL;
    $$;


--
-- Name: current_squad_member_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_squad_member_ids() RETURNS SETOF bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT DISTINCT e.user_id
  FROM public.enrolments e
  WHERE e.squad_id IN (SELECT public.current_squad_ids());
$$;


--
-- Name: enforce_student_submission_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_student_submission_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Staff grading is governed by the "staff grade submissions" policy.
  IF public.current_profile_role() IN ('Instructor', 'Administrator') THEN
    RETURN NEW;
  END IF;

  -- Trusted server/migration contexts (no end-user JWT) pass through.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.user_id IS DISTINCT FROM public.current_profile_id() THEN
    RAISE EXCEPTION 'You can only update your own submissions';
  END IF;

  IF OLD.status = 'graded' OR OLD.graded_at IS NOT NULL OR OLD.graded_by IS NOT NULL THEN
    RAISE EXCEPTION 'Graded submissions cannot be edited';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.lab_id IS DISTINCT FROM OLD.lab_id
     OR NEW.assessment_id IS DISTINCT FROM OLD.assessment_id
     OR NEW.squad_id IS DISTINCT FROM OLD.squad_id
     OR NEW.score IS DISTINCT FROM OLD.score
     OR NEW.feedback IS DISTINCT FROM OLD.feedback
     OR NEW.graded_by IS DISTINCT FROM OLD.graded_by
     OR NEW.graded_at IS DISTINCT FROM OLD.graded_at
     OR NEW.status IS DISTINCT FROM 'submitted' THEN
    RAISE EXCEPTION 'Students may only update submission content and resubmit';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    cohort_id bigint NOT NULL,
    track character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    final_grade numeric(5,2) DEFAULT NULL::numeric,
    attendance_percentage numeric(5,2) DEFAULT NULL::numeric,
    certificate_url character varying(500),
    skills_profile jsonb DEFAULT '{}'::jsonb,
    panel_review_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    certificate_number character varying(80),
    verification_token uuid DEFAULT gen_random_uuid(),
    issued_at timestamp with time zone,
    revoked_at timestamp with time zone,
    partner_course_id bigint,
    certificate_title character varying(200),
    partner_name character varying(200),
    partner_logo_url character varying(500),
    bluespace_logo_url character varying(500) DEFAULT '/logo.png'::character varying,
    CONSTRAINT certifications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'certified'::character varying, 'remediation'::character varying, 'deferred'::character varying])::text[]))),
    CONSTRAINT certifications_track_check CHECK (((track)::text = ANY ((ARRAY['Finsoft'::character varying, 'Finops'::character varying])::text[])))
);


--
-- Name: issue_certificate(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.issue_certificate(p_certification_id bigint) RETURNS public.certifications
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: issue_partner_certificate(bigint, bigint, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.issue_partner_certificate(p_user_id bigint, p_course_id bigint, p_final_grade numeric DEFAULT NULL::numeric) RETURNS public.certifications
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result public.certifications;
  course public.partner_courses;
  agency public.partners;
BEGIN
  IF public.current_profile_role() NOT IN ('Instructor', 'Administrator', 'Student')
     OR (public.current_profile_role() = 'Student' AND public.current_profile_id() <> p_user_id) THEN
    RAISE EXCEPTION 'You are not allowed to issue this certificate';
  END IF;
  IF public.current_profile_role() = 'Student' AND EXISTS (
    SELECT 1
    FROM public.partner_course_lessons l
    WHERE l.course_id = p_course_id AND l.is_published
      AND NOT EXISTS (
        SELECT 1 FROM public.partner_course_progress p
        WHERE p.lesson_id = l.id AND p.user_id = p_user_id AND p.is_completed
      )
  ) THEN
    RAISE EXCEPTION 'Complete all published lessons before issuing the certificate';
  END IF;
  SELECT * INTO course FROM public.partner_courses WHERE id = p_course_id AND status = 'published';
  IF course.id IS NULL THEN RAISE EXCEPTION 'Published partner course not found'; END IF;
  SELECT * INTO agency FROM public.partners WHERE id = course.partner_id;
  INSERT INTO public.certifications (
    user_id, cohort_id, track, status, final_grade, partner_course_id,
    partner_name, partner_logo_url, bluespace_logo_url, certificate_title
  )
  SELECT p_user_id, COALESCE(course.cohort_id, e.cohort_id), COALESCE(course.track, e.track),
    'certified', p_final_grade, course.id, agency.name, course.partner_logo_url, course.bluespace_logo_url, course.certificate_title
  FROM public.enrolments e
  WHERE e.user_id = p_user_id AND e.status IN ('enrolled', 'active', 'completed')
  ORDER BY e.created_at DESC LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    SELECT * INTO result FROM public.certifications WHERE user_id = p_user_id AND partner_course_id = p_course_id ORDER BY id DESC LIMIT 1;
  END IF;
  UPDATE public.certifications
  SET status = 'certified',
      certificate_number = COALESCE(certificate_number, 'BSP-' || to_char(now(), 'YYYY') || '-' || lpad(id::text, 6, '0')),
      verification_token = COALESCE(verification_token, gen_random_uuid()),
      issued_at = COALESCE(issued_at, now()),
      updated_at = now()
  WHERE id = result.id
  RETURNING * INTO result;
  RETURN result;
END;
$$;


--
-- Name: notify_clinic_booked(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_clinic_booked() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  clinic_title text;
BEGIN
  SELECT title INTO clinic_title FROM public.clinics WHERE id = NEW.clinic_id;
  PERFORM public.create_notification(NEW.user_id, 'Clinic booking confirmed', 'Your booking for ' || COALESCE(clinic_title, 'mentor clinic') || ' is confirmed.');
  RETURN NEW;
END;
$$;


--
-- Name: notify_submission_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_submission_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_submission_graded(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_submission_graded() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('passed', 'remediation', 'failed', 'graded') THEN
    PERFORM public.create_notification(NEW.user_id, 'Grade updated', 'Your submission has been reviewed. Open Grading or My Learning for feedback.');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: review_academy_application(bigint, character varying, bigint, character varying, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.review_academy_application(p_application_id bigint, p_decision character varying, p_cohort_id bigint DEFAULT NULL::bigint, p_track character varying DEFAULT NULL::character varying, p_reason text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  application_row public.academy_applications%ROWTYPE;
  reviewer_id bigint;
BEGIN
  IF public.current_profile_role() <> 'Administrator' THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid application decision';
  END IF;

  SELECT * INTO application_row
  FROM public.academy_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  IF application_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Application has already been reviewed';
  END IF;
  IF application_row.requested_role = 'Student'
     AND p_decision = 'approved'
     AND (p_cohort_id IS NULL OR p_track IS NULL) THEN
    RAISE EXCEPTION 'Approved student applications require a cohort and track';
  END IF;
  IF p_track IS NOT NULL AND p_track NOT IN ('Finsoft', 'Finops') THEN
    RAISE EXCEPTION 'Invalid track';
  END IF;

  reviewer_id := public.current_profile_id();

  UPDATE public.academy_applications
  SET status = p_decision,
      review_reason = NULLIF(trim(p_reason), ''),
      reviewed_by = reviewer_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = application_row.id;

  UPDATE public.users
  SET is_active = CASE WHEN p_decision = 'approved' THEN 1 ELSE 0 END,
      updated_at = now()
  WHERE auth_user_id = application_row.auth_user_id
     OR lower(email) = lower(application_row.email);

  IF p_decision = 'approved' AND application_row.requested_role = 'Student' THEN
    INSERT INTO public.enrolments (cohort_id, user_id, track, status)
    SELECT p_cohort_id, u.id, p_track, 'enrolled'
    FROM public.users u
    WHERE u.auth_user_id = application_row.auth_user_id
       OR lower(u.email) = lower(application_row.email)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;


--
-- Name: sprint_deliverables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sprint_deliverables (
    id bigint NOT NULL,
    sprint_id bigint NOT NULL,
    user_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    evidence_url character varying(500),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    score integer,
    feedback text,
    submitted_at timestamp with time zone,
    reviewed_by bigint,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sprint_deliverables_score_check CHECK (((score IS NULL) OR ((score >= 0) AND (score <= 100)))),
    CONSTRAINT sprint_deliverables_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'accepted'::character varying, 'remediation'::character varying])::text[])))
);


--
-- Name: review_sprint_deliverable(bigint, integer, text, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.review_sprint_deliverable(p_deliverable_id bigint, p_score integer, p_feedback text, p_status character varying) RETURNS public.sprint_deliverables
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: reviewable_submission_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reviewable_submission_ids() RETURNS SETOF bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT submission_id
  FROM public.peer_reviews
  WHERE reviewer_id = public.current_profile_id();
$$;


--
-- Name: verify_certificate(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_certificate(p_token uuid) RETURNS TABLE(certificate_number character varying, track character varying, issued_at timestamp with time zone, fellow_name character varying, cohort_name character varying)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.certificate_number, c.track, c.issued_at, u.name, h.name
  FROM public.certifications c
  JOIN public.users u ON u.id = c.user_id
  JOIN public.cohorts h ON h.id = c.cohort_id
  WHERE c.verification_token = p_token
    AND c.status = 'certified'
    AND c.revoked_at IS NULL;
$$;


--
-- Name: academy_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academy_applications (
    id bigint NOT NULL,
    auth_user_id uuid NOT NULL,
    user_id bigint,
    name character varying(191) NOT NULL,
    email character varying(191) NOT NULL,
    phone character varying(191),
    requested_role character varying(20) NOT NULL,
    track character varying(20),
    organisation character varying(200),
    motivation text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    review_reason text,
    reviewed_by bigint,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    website character varying(500),
    teaching_domains text[] DEFAULT '{}'::text[] NOT NULL,
    teaching_experience text,
    partnership_focus character varying(60),
    partnership_details text,
    CONSTRAINT academy_applications_requested_role_check CHECK (((requested_role)::text = ANY ((ARRAY['Student'::character varying, 'Instructor'::character varying, 'Partner'::character varying])::text[]))),
    CONSTRAINT academy_applications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT academy_applications_track_check CHECK (((track)::text = ANY ((ARRAY['Finsoft'::character varying, 'Finops'::character varying])::text[])))
);


--
-- Name: academy_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.academy_applications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.academy_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: announcement_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_reads (
    id bigint NOT NULL,
    announcement_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: announcement_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.announcement_reads ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.announcement_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id bigint NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    type character varying(30) DEFAULT 'announcement'::character varying NOT NULL,
    audience character varying(30) DEFAULT 'all'::character varying NOT NULL,
    author_id bigint NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.announcements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_attempts (
    id bigint NOT NULL,
    assessment_id bigint NOT NULL,
    user_id bigint NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    score integer,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    graded_at timestamp with time zone,
    CONSTRAINT assessment_attempts_score_check CHECK (((score IS NULL) OR ((score >= 0) AND (score <= 100)))),
    CONSTRAINT assessment_attempts_status_check CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'submitted'::character varying, 'graded'::character varying])::text[])))
);


--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assessment_attempts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assessment_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assessment_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_questions (
    id bigint NOT NULL,
    assessment_id bigint NOT NULL,
    prompt text NOT NULL,
    question_type character varying(20) DEFAULT 'single_choice'::character varying NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    correct_answer jsonb,
    points integer DEFAULT 1 NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assessment_questions_points_check CHECK ((points > 0)),
    CONSTRAINT assessment_questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['single_choice'::character varying, 'multiple_choice'::character varying, 'short_answer'::character varying])::text[])))
);


--
-- Name: assessment_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assessment_questions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assessment_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessments (
    id bigint NOT NULL,
    module_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    weight numeric(5,2) DEFAULT 0 NOT NULL,
    max_score integer DEFAULT 100 NOT NULL,
    pass_mark integer DEFAULT 70 NOT NULL,
    due_date timestamp with time zone,
    is_published boolean DEFAULT false NOT NULL,
    created_by bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assessments_type_check CHECK (((type)::text = ANY ((ARRAY['quiz'::character varying, 'domain_assessment'::character varying, 'capstone'::character varying, 'peer_review'::character varying, 'mentor_evaluation'::character varying])::text[])))
);


--
-- Name: assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assessments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assessments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id bigint,
    user_name character varying(191) DEFAULT NULL::character varying,
    user_role character varying(20) DEFAULT NULL::character varying,
    action character varying(50) NOT NULL,
    entity_type character varying(50) DEFAULT NULL::character varying,
    entity_id bigint,
    description text NOT NULL,
    metadata jsonb,
    ip_address character varying(45) DEFAULT NULL::character varying,
    severity character varying(10) DEFAULT 'INFO'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.certifications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.certifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clinic_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_bookings (
    id bigint NOT NULL,
    clinic_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status character varying(20) DEFAULT 'booked'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT clinic_bookings_status_check CHECK (((status)::text = ANY ((ARRAY['booked'::character varying, 'attended'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: clinic_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clinic_bookings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clinic_bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinics (
    id bigint NOT NULL,
    title character varying(200) NOT NULL,
    cohort_id bigint,
    mentor_id bigint,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    meet_url character varying(500),
    capacity integer DEFAULT 15 NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    attendee_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by bigint,
    CONSTRAINT clinics_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: clinics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clinics ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clinics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cohorts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cohorts (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    track_finsoft boolean DEFAULT true NOT NULL,
    track_finops boolean DEFAULT true NOT NULL,
    capacity integer DEFAULT 40 NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    created_by bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cohorts_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'completed'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: cohorts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cohorts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cohorts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: enrolments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrolments (
    id bigint NOT NULL,
    cohort_id bigint NOT NULL,
    user_id bigint NOT NULL,
    track character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'enrolled'::character varying NOT NULL,
    squad_id bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT enrolments_status_check CHECK (((status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying, 'withdrawn'::character varying, 'suspended'::character varying])::text[]))),
    CONSTRAINT enrolments_track_check CHECK (((track)::text = ANY ((ARRAY['Finsoft'::character varying, 'Finops'::character varying])::text[])))
);


--
-- Name: enrolments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.enrolments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.enrolments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: google_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_integrations (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    provider character varying(30) DEFAULT 'google_workspace'::character varying NOT NULL,
    calendar_email character varying(255),
    access_token_encrypted text,
    refresh_token_encrypted text,
    token_expires_at timestamp with time zone,
    scopes text[] DEFAULT ARRAY[]::text[] NOT NULL,
    connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT google_integrations_provider_check CHECK (((provider)::text = 'google_workspace'::text))
);


--
-- Name: google_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.google_integrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.google_integrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: instructor_cohort_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_cohort_assignments (
    id bigint NOT NULL,
    instructor_id bigint NOT NULL,
    cohort_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: instructor_cohort_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.instructor_cohort_assignments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.instructor_cohort_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: instructor_squad_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_squad_assignments (
    id bigint NOT NULL,
    instructor_id bigint NOT NULL,
    squad_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: instructor_squad_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.instructor_squad_assignments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.instructor_squad_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: labs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.labs (
    id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    instructions text NOT NULL,
    starter_code text,
    solution_code text,
    due_date timestamp with time zone,
    max_score integer DEFAULT 100 NOT NULL,
    track_specific boolean DEFAULT false NOT NULL,
    created_by bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: labs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.labs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.labs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_progress (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    watch_time_seconds integer DEFAULT 0 NOT NULL,
    completion_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    last_position_seconds integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lesson_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lesson_progress ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.lesson_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id bigint NOT NULL,
    module_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    content_url character varying(500),
    video_url character varying(500),
    audio_url character varying(500),
    thumbnail_url character varying(500),
    caption_url character varying(500),
    is_required boolean DEFAULT true NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_by bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lessons_type_check CHECK (((type)::text = ANY ((ARRAY['concept'::character varying, 'demonstration'::character varying, 'video'::character varying, 'audio'::character varying, 'lab'::character varying, 'assessment'::character varying, 'clinic'::character varying, 'standup'::character varying, 'sprint_review'::character varying, 'retrospective'::character varying])::text[])))
);


--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lessons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.lessons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: live_class_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.live_class_attendance (
    id bigint NOT NULL,
    live_class_id bigint NOT NULL,
    user_id bigint NOT NULL,
    joined_at timestamp with time zone,
    left_at timestamp with time zone,
    status character varying(20) DEFAULT 'invited'::character varying NOT NULL,
    CONSTRAINT live_class_attendance_status_check CHECK (((status)::text = ANY ((ARRAY['invited'::character varying, 'attended'::character varying, 'absent'::character varying])::text[])))
);


--
-- Name: live_class_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.live_class_attendance ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.live_class_attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: live_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.live_classes (
    id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    cohort_id bigint,
    module_id bigint,
    instructor_id bigint NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    visibility character varying(20) DEFAULT 'private'::character varying NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    meet_url character varying(500),
    google_event_id character varying(255),
    recording_url character varying(500),
    is_offline boolean DEFAULT false NOT NULL,
    venue character varying(500),
    notes text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT live_classes_check CHECK ((ends_at > starts_at)),
    CONSTRAINT live_classes_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'live'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT live_classes_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['private'::character varying, 'cohort'::character varying])::text[])))
);


--
-- Name: live_classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.live_classes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.live_classes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mentor_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentor_evaluations (
    id bigint NOT NULL,
    sprint_id bigint NOT NULL,
    user_id bigint NOT NULL,
    mentor_id bigint NOT NULL,
    score integer NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mentor_evaluations_score_check CHECK (((score >= 0) AND (score <= 100)))
);


--
-- Name: mentor_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mentor_evaluations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.mentor_evaluations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id bigint NOT NULL,
    cohort_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    stage character varying(20) NOT NULL,
    domain character varying(20),
    track character varying(20),
    description text,
    week_start integer NOT NULL,
    week_end integer NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT modules_domain_check CHECK (((domain)::text = ANY ((ARRAY['FaaS'::character varying, 'FinCore'::character varying, 'FinOps'::character varying, 'FinInfra'::character varying])::text[]))),
    CONSTRAINT modules_stage_check CHECK (((stage)::text = ANY ((ARRAY['foundations'::character varying, 'domain_immersion'::character varying, 'live_projects'::character varying, 'certification'::character varying])::text[]))),
    CONSTRAINT modules_track_check CHECK (((track)::text = ANY ((ARRAY['Finsoft'::character varying, 'Finops'::character varying, 'All'::character varying])::text[])))
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.modules ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.modules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type text NOT NULL,
    data text NOT NULL,
    is_read smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notifications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: partner_course_enrolments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_course_enrolments (
    id bigint NOT NULL,
    course_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT partner_course_enrolments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'withdrawn'::character varying])::text[])))
);


--
-- Name: partner_course_enrolments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.partner_course_enrolments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.partner_course_enrolments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: partner_course_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_course_lessons (
    id bigint NOT NULL,
    course_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    content_url character varying(500),
    video_url character varying(500),
    order_index integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: partner_course_lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.partner_course_lessons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.partner_course_lessons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: partner_course_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_course_progress (
    id bigint NOT NULL,
    course_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    user_id bigint NOT NULL,
    completion_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    last_position_seconds integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: partner_course_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.partner_course_progress ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.partner_course_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: partner_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_courses (
    id bigint NOT NULL,
    partner_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    thumbnail_url character varying(500),
    cohort_id bigint,
    track character varying(20),
    status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    rejection_reason text,
    certificate_title character varying(200) DEFAULT 'Partner Course Certificate'::character varying NOT NULL,
    partner_logo_url character varying(500),
    bluespace_logo_url character varying(500) DEFAULT '/logo.png'::character varying NOT NULL,
    created_by bigint,
    approved_by bigint,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    summary text,
    slug character varying(220),
    CONSTRAINT partner_courses_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'under_review'::character varying, 'changes_requested'::character varying, 'approved'::character varying, 'published'::character varying, 'rejected'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT partner_courses_track_check CHECK (((track)::text = ANY ((ARRAY['Finsoft'::character varying, 'Finops'::character varying, 'All'::character varying])::text[])))
);


--
-- Name: COLUMN partner_courses.summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_courses.summary IS 'Short marketing summary shown in course cards';


--
-- Name: COLUMN partner_courses.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_courses.slug IS 'URL-friendly unique identifier for the course';


--
-- Name: partner_courses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.partner_courses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.partner_courses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id bigint NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(220) NOT NULL,
    description text,
    website character varying(500),
    logo_url character varying(500),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_by bigint,
    approved_by bigint,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT partners_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'suspended'::character varying])::text[])))
);


--
-- Name: partners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.partners ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.partners_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: peer_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.peer_reviews (
    id bigint NOT NULL,
    submission_id bigint NOT NULL,
    reviewer_id bigint NOT NULL,
    score integer,
    feedback text,
    status character varying(20) DEFAULT 'assigned'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT peer_reviews_score_check CHECK (((score IS NULL) OR ((score >= 0) AND (score <= 100)))),
    CONSTRAINT peer_reviews_status_check CHECK (((status)::text = ANY ((ARRAY['assigned'::character varying, 'submitted'::character varying])::text[])))
);


--
-- Name: peer_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.peer_reviews ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.peer_reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: placements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placements (
    id bigint NOT NULL,
    certification_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role character varying(50) NOT NULL,
    project_id character varying(200),
    start_date date,
    status character varying(20) DEFAULT 'matched'::character varying NOT NULL,
    checkin_30_days timestamp with time zone,
    checkin_60_days timestamp with time zone,
    checkin_90_days timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT placements_role_check CHECK (((role)::text = ANY ((ARRAY['Project Manager'::character varying, 'Field Lead'::character varying, 'UAT'::character varying, 'Technical Specialist'::character varying])::text[]))),
    CONSTRAINT placements_status_check CHECK (((status)::text = ANY ((ARRAY['matched'::character varying, 'interviewing'::character varying, 'placed'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: placements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.placements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.placements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: skills_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills_profiles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_preference character varying(50),
    domains text[] DEFAULT ARRAY[]::text[] NOT NULL,
    skills jsonb DEFAULT '{}'::jsonb NOT NULL,
    notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: skills_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.skills_profiles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.skills_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sprint_deliverables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sprint_deliverables ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sprint_deliverables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sprints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sprints (
    id bigint NOT NULL,
    use_case_id bigint NOT NULL,
    squad_id bigint NOT NULL,
    sprint_number integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    uat_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sprints_sprint_number_check CHECK ((sprint_number = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT sprints_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: sprints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sprints ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sprints_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: squads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.squads (
    id bigint NOT NULL,
    cohort_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    squad_lead_id bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: squads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.squads ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.squads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lab_id bigint,
    assessment_id bigint,
    squad_id bigint,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    content_url character varying(500),
    score integer,
    feedback text,
    graded_by bigint,
    graded_at timestamp with time zone,
    submitted_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT submissions_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'graded'::character varying, 'remediation'::character varying, 'passed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.submissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: use_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.use_cases (
    id bigint NOT NULL,
    cohort_id bigint NOT NULL,
    domain character varying(20) NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    stakeholder character varying(200),
    sandbox_access boolean DEFAULT false NOT NULL,
    anonymised_data boolean DEFAULT true NOT NULL,
    confidentiality_terms text,
    status character varying(20) DEFAULT 'proposed'::character varying NOT NULL,
    created_by bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    squad_id bigint,
    CONSTRAINT use_cases_domain_check CHECK (((domain)::text = ANY ((ARRAY['FaaS'::character varying, 'FinCore'::character varying, 'FinOps'::character varying, 'FinInfra'::character varying])::text[]))),
    CONSTRAINT use_cases_status_check CHECK (((status)::text = ANY ((ARRAY['proposed'::character varying, 'qualified'::character varying, 'assigned'::character varying, 'completed'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: use_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.use_cases ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.use_cases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(191) DEFAULT NULL::character varying,
    email character varying(191) NOT NULL,
    password character varying(191) DEFAULT NULL::character varying,
    type character varying(20) DEFAULT NULL::character varying,
    avatar character varying(191) DEFAULT 'avatar.png'::character varying NOT NULL,
    phone character varying(191) DEFAULT NULL::character varying,
    is_active integer DEFAULT 1 NOT NULL,
    force_password_change smallint DEFAULT 0 NOT NULL,
    last_login_at timestamp with time zone,
    partner_id bigint,
    student_id character varying(50) DEFAULT NULL::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    auth_user_id uuid,
    CONSTRAINT users_type_check CHECK (((type)::text = ANY ((ARRAY['Student'::character varying, 'Instructor'::character varying, 'Partner'::character varying, 'Administrator'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: academy_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.academy_applications (id, auth_user_id, user_id, name, email, phone, requested_role, track, organisation, motivation, status, review_reason, reviewed_by, reviewed_at, created_at, updated_at, website, teaching_domains, teaching_experience, partnership_focus, partnership_details) FROM stdin;
1	22222222-2222-4222-8222-222222222222	\N	Nadia Mensah	nadia.mensah@example.com	+233 20 555 0142	Student	Finsoft	University of Ghana	I want to move from backend development into payments engineering and build production ledger systems.	pending	\N	\N	\N	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	\N	{}	\N	\N	\N
2	33333333-3333-4333-8333-333333333333	\N	Daniel Boateng	daniel.boateng@example.com	+234 80 555 0198	Instructor	\N	Lagos Fintech Lab	I would like to teach reconciliation and settlement operations using real sandbox exercises.	pending	\N	\N	\N	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	https://example.com/daniel-boateng	{FinOps,FinInfra}	Eight years leading settlement operations and reconciliation engineering at a pan-African PSP.	\N	\N
3	44444444-4444-4444-8444-444444444444	\N	Amara Okafor	amara.okafor@example.com	+254 71 555 0177	Partner	\N	Sahara Identity	We want to publish a KYC operations elective for academy fellows.	pending	\N	\N	\N	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	https://example.com/sahara-identity	{}	\N	KYC & identity verification	Sahara Identity provides tiered KYC and sanctions screening across East Africa.
\.


--
-- Data for Name: announcement_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcement_reads (id, announcement_id, user_id, read_at) FROM stdin;
1	1	1	2026-11-06 22:16:52.091532+00
2	1	2	2026-11-06 22:16:52.091532+00
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, type, audience, author_id, pinned, created_at, updated_at) FROM stdin;
1	Welcome to Cohort 1 - BlueSPACE Fintech Academy	Welcome to the academy! Orientation schedules, squad workspace allocations, syllabus access, and partner electives from TrustNet and Samsub have unlocked.	announcement	all	10	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_attempts (id, assessment_id, user_id, answers, score, status, started_at, submitted_at, graded_at) FROM stdin;
1	2	1	{}	85	graded	2026-11-03 22:16:52.091532+00	2026-11-03 22:34:52.091532+00	2026-11-04 22:16:52.091532+00
\.


--
-- Data for Name: assessment_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_questions (id, assessment_id, prompt, question_type, options, correct_answer, points, order_index, created_at, updated_at) FROM stdin;
1	2	Select the controls that make an outbound webhook pipeline safe to retry.	multiple_choice	["Signed payloads", "Idempotent handlers", "Unbounded retries", "Exponential backoff with a cap"]	["Signed payloads", "Idempotent handlers", "Exponential backoff with a cap"]	2	2	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	2	Which HTTP status code should a payment API return when an idempotency key is reused with a different request body?	single_choice	["200 OK", "409 Conflict", "422 Unprocessable Entity", "503 Service Unavailable"]	"409 Conflict"	1	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
3	1	Upload the repository URL for your reconciliation engine and explain how discrepancies are surfaced.	short_answer	[]	null	20	1	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
4	1	Describe how you enforce the invariant that total debits equal total credits under concurrent writes.	short_answer	[]	null	20	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
5	2	In a double-entry ledger, every transaction must debit at least one account and credit at least one other account for the same total amount.	single_choice	["True", "False"]	"True"	1	1	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
6	3	Which reconciliation break type is caused by a payment captured at the gateway but never settled by the bank?	single_choice	["Timing break", "Amount break", "Missing settlement", "Duplicate posting"]	"Missing settlement"	1	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessments (id, module_id, title, type, weight, max_score, pass_mark, due_date, is_published, created_by, created_at, updated_at) FROM stdin;
1	2	FinCore Capstone: Ledger Integrity & Reconciliation	capstone	40.00	100	70	2026-12-09 22:16:52.091532+00	t	10	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	3	Fintech Foundations Knowledge Check	quiz	10.00	100	70	2026-11-23 22:16:52.091532+00	t	10	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
3	4	FinOps Domain Assessment: Reconciliation Controls	domain_assessment	20.00	100	70	2026-12-03 22:16:52.091532+00	t	10	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, description, metadata, ip_address, severity, created_at) FROM stdin;
1	10	Academy Team Lead	Administrator	placement.matched	placements	1	Matched Test Student to Technical Specialist on PRJ-FINCORE-2026.	{"role": "Technical Specialist", "project_id": "PRJ-FINCORE-2026"}	127.0.0.1	INFO	2026-11-09 22:16:52.091532+00
2	10	Academy Team Lead	Administrator	application.received	academy_applications	1	Received a pending Student application from Nadia Mensah.	{"requested_role": "Student"}	127.0.0.1	INFO	2026-11-09 22:16:52.091532+00
3	10	Academy Team Lead	Administrator	partner_course.published	partner_courses	1	Published the TrustNet fraud-prevention elective to the partner catalog.	{"partner": "TrustNet Africa"}	127.0.0.1	INFO	2026-11-09 22:16:52.091532+00
4	10	Academy Team Lead	Administrator	certificate.issued	certifications	1	Issued BlueSPACE Certified Fintech Engineer certificate BSA-2026-000001 to Test Student.	{"certificate_number": "BSA-2026-000001"}	127.0.0.1	INFO	2026-11-09 22:16:52.091532+00
5	10	Academy Team Lead	Administrator	application.received	academy_applications	2	Received a pending Instructor application from Daniel Boateng.	{"requested_role": "Instructor"}	127.0.0.1	INFO	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certifications (id, user_id, cohort_id, track, status, final_grade, attendance_percentage, certificate_url, skills_profile, panel_review_date, created_at, updated_at, certificate_number, verification_token, issued_at, revoked_at, partner_course_id, certificate_title, partner_name, partner_logo_url, bluespace_logo_url) FROM stdin;
1	1	1	Finsoft	certified	91.00	92.00	/verify-certificate/11111111-1111-4111-8111-111111111111	{"ledger": "advanced", "api_design": "proficient", "reconciliation": "advanced"}	2026-11-05 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	BSA-2026-000001	11111111-1111-4111-8111-111111111111	2026-11-05 22:16:52.091532+00	\N	\N	BlueSPACE Certified Fintech Engineer	\N	\N	/logo-dark.png
2	2	1	Finsoft	pending	\N	78.00	\N	{"ledger": "proficient", "api_design": "proficient", "reconciliation": "developing"}	2026-11-12 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-09 22:18:11.047958+00	\N	\N	\N	\N	\N	\N	\N	\N	/logo.png
\.


--
-- Data for Name: clinic_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinic_bookings (id, clinic_id, user_id, status, created_at) FROM stdin;
1	1	2	attended	2026-11-09 22:16:52.091532+00
2	1	1	booked	2026-11-09 22:16:52.091532+00
3	2	3	booked	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinics (id, title, cohort_id, mentor_id, starts_at, ends_at, meet_url, capacity, status, attendee_count, created_at, updated_at, created_by) FROM stdin;
1	FinCore Ledger Architecture & Code Review Clinic	1	7	2026-11-07 14:57:16.083826+00	2026-11-07 15:57:16.083826+00	https://meet.google.com/clinic-fincore	15	scheduled	4	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00	10
2	Fintech Career Mentoring & Squad Sprint Office Hours	1	10	2026-11-09 16:57:16.083826+00	2026-11-09 17:57:16.083826+00	https://meet.google.com/clinic-career	10	scheduled	2	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00	10
\.


--
-- Data for Name: cohorts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cohorts (id, name, track_finsoft, track_finops, capacity, start_date, end_date, status, created_by, created_at, updated_at) FROM stdin;
1	Cohort 1 - December 2026	t	t	40	2026-12-01	2027-04-15	active	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	Cohort 2 - March 2027	t	t	40	2027-03-01	2027-07-15	planned	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: enrolments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrolments (id, cohort_id, user_id, track, status, squad_id, created_at, updated_at) FROM stdin;
1	1	6	Finsoft	active	1	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	1	3	Finsoft	active	1	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
3	1	4	Finsoft	active	1	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
5	1	2	Finsoft	active	1	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
6	1	5	Finsoft	active	1	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
4	1	1	Finsoft	active	1	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.466502+00
\.


--
-- Data for Name: google_integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.google_integrations (id, user_id, provider, calendar_email, access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes, connected_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: instructor_cohort_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instructor_cohort_assignments (id, instructor_id, cohort_id, created_at) FROM stdin;
1	7	1	2026-11-06 11:57:16.632327+00
2	8	1	2026-11-06 11:57:16.632327+00
3	9	1	2026-11-06 11:57:16.632327+00
\.


--
-- Data for Name: instructor_squad_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instructor_squad_assignments (id, instructor_id, squad_id, created_at) FROM stdin;
1	7	1	2026-11-06 11:57:16.632327+00
2	8	1	2026-11-06 11:57:16.632327+00
3	9	1	2026-11-06 11:57:16.632327+00
\.


--
-- Data for Name: labs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.labs (id, lesson_id, title, instructions, starter_code, solution_code, due_date, max_score, track_specific, created_by, created_at, updated_at) FROM stdin;
1	6	Guided Lab: Double-Entry Ledger Posting with Balance Checks	Implement an idempotent double-entry balance updater in Node.js/PostgreSQL. Ensure all debits equal credits and enforce balance invariants.	// Starter template\nasync function recordTransaction(debitAccount, creditAccount, amount) {\n  // TODO: implement transaction\n}	\N	2026-11-20 00:00:00+00	100	f	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	7	Guided Lab: Payment Switch & Idempotency Key Processor	Build an HTTP endpoint that validates client idempotency keys using Redis/PostgreSQL and forwards requests to banking sandbox rails.	// Starter template\nexport async function handlePayment(req, res) {\n  const idempotencyKey = req.headers["idempotency-key"];\n}	\N	2026-11-27 00:00:00+00	100	f	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lesson_progress (id, user_id, lesson_id, watch_time_seconds, completion_percentage, is_completed, last_position_seconds, completed_at, created_at, updated_at) FROM stdin;
1	1	7	5400	100.00	t	5400	2026-11-04 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-04 22:16:52.091532+00
2	1	6	0	0.00	f	0	\N	2026-11-09 22:16:52.091532+00	2026-11-08 22:16:52.091532+00
3	1	5	1350	45.00	f	1350	\N	2026-11-09 22:16:52.091532+00	2026-11-06 22:16:52.091532+00
4	1	4	3600	100.00	t	3600	2026-10-31 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-31 22:16:52.091532+00
5	1	3	2900	100.00	t	2900	2026-10-26 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-26 22:16:52.091532+00
6	1	2	3300	100.00	t	3300	2026-10-22 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-22 22:16:52.091532+00
7	1	1	2680	100.00	t	2680	2026-10-19 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-19 22:16:52.091532+00
8	2	4	3600	100.00	t	3600	2026-11-01 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-01 22:16:52.091532+00
9	2	2	1800	55.00	f	1800	\N	2026-11-09 22:16:52.091532+00	2026-10-28 22:16:52.091532+00
10	2	1	2680	100.00	t	2680	2026-10-20 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-20 22:16:52.091532+00
11	3	7	5400	100.00	t	5400	2026-11-05 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-05 22:16:52.091532+00
12	3	6	5400	100.00	t	5400	2026-11-03 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-03 22:16:52.091532+00
13	3	5	3000	100.00	t	3000	2026-11-02 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-02 22:16:52.091532+00
14	3	4	3600	100.00	t	3600	2026-10-29 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-29 22:16:52.091532+00
15	3	3	3000	100.00	t	3000	2026-10-25 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-25 22:16:52.091532+00
16	3	2	3300	100.00	t	3300	2026-10-21 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-21 22:16:52.091532+00
17	3	1	2680	100.00	t	2680	2026-10-18 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-18 22:16:52.091532+00
18	4	2	1600	48.00	f	1600	\N	2026-11-09 22:16:52.091532+00	2026-10-30 22:16:52.091532+00
19	4	1	2680	100.00	t	2680	2026-10-23 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-23 22:16:52.091532+00
20	5	1	2680	100.00	t	2680	2026-10-24 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-10-24 22:16:52.091532+00
21	6	2	3300	100.00	t	3300	2026-11-05 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-05 22:16:52.091532+00
22	6	1	1400	52.00	f	1400	\N	2026-11-09 22:16:52.091532+00	2026-11-03 22:16:52.091532+00
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lessons (id, module_id, title, type, duration_minutes, content_url, video_url, audio_url, thumbnail_url, caption_url, is_required, order_index, created_by, created_at, updated_at) FROM stdin;
1	3	Payment APIs Explained: Authorization, Capture, Settlement & Payout	video	45	\N	https://www.youtube.com/watch?v=hzr9WOu2BDk	\N	\N	\N	t	1	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	3	System Design Global Payment Processing: PayPal Architecture	video	55	\N	https://www.youtube.com/watch?v=7MXV7RfNtv0	\N	\N	\N	t	2	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
3	3	Payment Gateway Architecture: Webhooks, Timeouts & Idempotency	video	50	\N	https://www.youtube.com/watch?v=B_PQUmRUxfU	\N	\N	\N	t	3	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
4	2	Double-Entry General Ledger Architecture for Fintechs	video	60	\N	https://www.youtube.com/watch?v=Bf0I3XEbPrw	\N	\N	\N	t	1	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
5	2	Designing Resilient Payment Gateways (Stripe & Razorpay Patterns)	video	50	\N	https://www.youtube.com/watch?v=7EnqCwQOddY	\N	\N	\N	t	2	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
6	2	Guided Lab: Double-Entry Ledger Posting with Balance Checks	lab	90	\N	\N	\N	\N	\N	t	3	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
7	3	Guided Lab: Payment Switch & Idempotency Key Processor	lab	90	\N	\N	\N	\N	\N	t	4	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: live_class_attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.live_class_attendance (id, live_class_id, user_id, joined_at, left_at, status) FROM stdin;
1	2	1	2026-11-11 13:59:16.083826+00	\N	invited
3	2	2	2026-11-11 13:59:16.083826+00	\N	invited
4	1	2	2026-11-08 15:59:16.083826+00	2026-11-08 17:57:16.083826+00	attended
5	2	3	2026-11-11 13:59:16.083826+00	\N	invited
6	1	3	2026-11-08 15:59:16.083826+00	2026-11-08 17:57:16.083826+00	attended
7	1	4	2026-11-08 15:59:16.083826+00	\N	absent
8	1	5	2026-11-08 15:59:16.083826+00	2026-11-08 17:57:16.083826+00	attended
9	1	6	2026-11-08 15:59:16.083826+00	\N	absent
2	1	1	2026-11-08 15:59:16.083826+00	2026-11-08 17:57:16.083826+00	attended
\.


--
-- Data for Name: live_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.live_classes (id, title, description, cohort_id, module_id, instructor_id, starts_at, ends_at, visibility, status, meet_url, google_event_id, recording_url, is_offline, venue, notes, created_by, created_at, updated_at) FROM stdin;
1	Masterclass: Core Banking Ledgers & Idempotent Transactions	Deep dive into ACID transaction semantics, double-entry ledger database schemas, and avoiding race conditions on payment rails.	1	\N	7	2026-11-08 15:57:16.083826+00	2026-11-08 17:57:16.083826+00	cohort	scheduled	https://meet.google.com/xyz-blue-fin	\N	\N	f	Virtual Stream	\N	10	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	Workshop: TrustNet & Samsub API Security Lab	Hands-on implementation of webhook signatures, HMAC validation, and KYC callback ingestion.	1	\N	10	2026-11-11 13:57:16.083826+00	2026-11-11 15:57:16.083826+00	cohort	scheduled	https://meet.google.com/abc-trust-sam	\N	\N	f	Virtual Stream	\N	10	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: mentor_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mentor_evaluations (id, sprint_id, user_id, mentor_id, score, feedback, created_at, updated_at) FROM stdin;
1	2	2	7	88	Strong squad coordination and clear sprint notes.	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	2	3	7	85	Good ingestion design. Needs to lead the next demo and explain trade-offs more crisply.	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
3	2	1	7	90	Consistently strong technical communication and ownership of the ledger invariants.	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, cohort_id, title, stage, domain, track, description, week_start, week_end, is_published, created_by, created_at, updated_at) FROM stdin;
1	1	FaaS: Partner-Ready Payment APIs & Microservices	domain_immersion	FaaS	Finsoft	Designing partner-ready APIs, developer documentation, sandbox testing environments, and API rate limiting.	9	10	t	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	1	FinCore: High-Throughput Ledger & Transaction Engineering	domain_immersion	FinCore	Finsoft	Double-entry ledgers, ACID guarantees, idempotency keys, and ledger invariant verification under high concurrency.	4	6	t	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
3	1	Fintech & Open Banking Architecture	foundations	\N	All	Common protocols, payment rails, API security, and transaction switching fundamentals across African fintech ecosystems.	1	3	t	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
4	1	FinOps: Automated Reconciliation & Financial Pipelines	domain_immersion	FinOps	Finops	Automated settlement reconciliation, discrepancy handling, regulatory reporting, and exception triaging.	7	8	t	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, data, is_read, created_at, updated_at) FROM stdin;
1	1	module_unlocked	Module 1: Fintech & Open Banking Architecture is now available.	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	1	partner_courses	New industry electives from TrustNet and Samsub are available in the Partner Catalog.	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
3	1	clinic_scheduled	Mentor clinic: FinCore Ledger Architecture is open for booking.	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
4	1	squad_assigned	You have been assigned to Squad Alpha (Payment Rails).	0	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
5	1	partner_courses	New industry electives by TrustNet and Samsub are available in the Partner Catalog.	0	2026-11-06 11:57:16.466502+00	2026-11-06 11:57:16.466502+00
6	7	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
7	8	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
8	9	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
9	10	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
10	7	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
11	8	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
12	9	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
13	10	New submission	A student submitted work for review.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
14	2	Clinic booking confirmed	Your booking for FinCore Ledger Architecture & Code Review Clinic is confirmed.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
15	1	Clinic booking confirmed	Your booking for FinCore Ledger Architecture & Code Review Clinic is confirmed.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
16	3	Clinic booking confirmed	Your booking for Fintech Career Mentoring & Squad Sprint Office Hours is confirmed.	0	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
17	2	Grade updated	Your submission has been reviewed. Open Grading or My Learning for feedback.	0	2026-11-09 22:18:00.619266+00	2026-11-09 22:18:00.619266+00
\.


--
-- Data for Name: partner_course_enrolments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_course_enrolments (id, course_id, user_id, status, enrolled_at, completed_at) FROM stdin;
1	1	6	active	2026-11-06 11:57:16.638221+00	\N
2	2	5	active	2026-11-06 11:57:16.638221+00	\N
3	2	2	active	2026-11-06 11:57:16.638221+00	\N
4	1	3	active	2026-11-06 11:57:16.638221+00	\N
5	1	4	active	2026-11-06 11:57:16.638221+00	\N
6	1	1	active	2026-11-06 11:57:16.638221+00	\N
7	2	3	active	2026-11-06 11:57:16.638221+00	\N
8	1	2	active	2026-11-06 11:57:16.638221+00	\N
10	2	4	active	2026-11-06 11:57:16.638221+00	\N
11	2	6	active	2026-11-06 11:57:16.638221+00	\N
12	1	5	active	2026-11-06 11:57:16.638221+00	\N
9	2	1	active	2026-11-06 11:57:16.638221+00	\N
\.


--
-- Data for Name: partner_course_lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_course_lessons (id, course_id, title, description, content_url, video_url, order_index, is_published, created_at, updated_at) FROM stdin;
1	1	Fraud Risk Vectors & Global Payment Processing Architecture	An architectural overview of payment gateways, fraud detection mechanisms, and high-volume transaction routing.	\N	https://www.youtube.com/watch?v=7MXV7RfNtv0	1	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	1	Payment APIs Explained: Authorization, Capture, Settlement & Payout	End-to-end walkthrough of transaction lifecycles, merchant balance settlements, and reconciliation workflows.	\N	https://www.youtube.com/watch?v=hzr9WOu2BDk	3	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
3	1	Payment Gateway System Design: Timeouts, Sagas & Webhooks	Step-by-step implementation of resilient payment states, idempotency guarantees, and secure webhook event distribution.	\N	https://www.youtube.com/watch?v=B_PQUmRUxfU	2	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
4	2	System Design: Building Scalable Payment & Compliance Pipelines	Architecting resilient distributed microservices for payment routing, verification pipelines, and fault tolerance.	\N	https://www.youtube.com/watch?v=7EnqCwQOddY	3	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
5	2	KYC & AML Explained: Compliance Essentials for Fintechs	Understanding customer due diligence, tiered verification, sanctions screening, and global regulatory mandates.	\N	https://www.youtube.com/watch?v=suOq0FkyIpg	1	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
6	2	Comprehensive AML Training: Frameworks, CDD & Monitoring	Detailed breakdown of Anti-Money Laundering frameworks, Customer Due Diligence (CDD), and automated risk scoring.	\N	https://www.youtube.com/watch?v=BN17lynNFSk	2	t	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: partner_course_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_course_progress (id, course_id, lesson_id, user_id, completion_percentage, is_completed, last_position_seconds, updated_at) FROM stdin;
1	2	5	1	100.00	t	0	2026-11-06 12:03:58.22222+00
\.


--
-- Data for Name: partner_courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_courses (id, partner_id, title, description, thumbnail_url, cohort_id, track, status, rejection_reason, certificate_title, partner_logo_url, bluespace_logo_url, created_by, approved_by, submitted_at, approved_at, published_at, created_at, updated_at, summary, slug) FROM stdin;
1	1	TrustNet: Real-Time Fraud Prevention & Transaction Monitoring	Master modern rules engines, anomaly detection, velocity checks, and anti-money laundering (AML) compliance pipelines in payment processing systems.	\N	\N	Finops	published	\N	TrustNet Certified Fintech Risk & AML Specialist	\N	/logo.png	\N	\N	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00	\N	trustnet-real-time-fraud-prevention-transaction-monitoring
2	2	Samsub: Full-Cycle KYC & Regulatory Compliance Masterclass	Learn to implement automated identity proofing, document verification, PEP/sanctions checks, and travel rule compliance for international fintech applications.	\N	\N	Finsoft	published	\N	Samsub Certified Compliance & Identity Engineer	\N	/logo.png	\N	\N	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00	\N	samsub-full-cycle-kyc-regulatory-compliance-masterclass
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partners (id, name, slug, description, website, logo_url, status, created_by, approved_by, approved_at, created_at, updated_at) FROM stdin;
1	TrustNet Africa	trustnet	Digital identity verification, AML transaction monitoring, and fraud prevention network engineered for African fintechs and digital banks.	https://trustnet.africa	https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80	approved	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
2	Samsub Compliance	samsub	Global all-in-one verification platform securing the user journey with automated KYC, KYB, transaction monitoring, and travel rule compliance.	https://sumsub.com	https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80	approved	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: peer_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.peer_reviews (id, submission_id, reviewer_id, score, feedback, status, created_at, updated_at) FROM stdin;
2	4	2	88	Clear structure and good use of invariant checks. The README could document the rounding strategy more explicitly.	submitted	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
1	1	1	\N		assigned	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: placements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.placements (id, certification_id, user_id, role, project_id, start_date, status, checkin_30_days, checkin_60_days, checkin_90_days, created_at, updated_at) FROM stdin;
1	1	1	Technical Specialist	PRJ-FINCORE-2026	2026-10-20	placed	2026-11-08 22:16:52.091532+00	\N	\N	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	2	2	UAT	PRJ-TRUSTNET-2026	2026-11-23	matched	\N	\N	\N	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: skills_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skills_profiles (id, user_id, role_preference, domains, skills, notes, updated_at, created_at) FROM stdin;
1	1	Backend Engineer	{FinCore,FaaS}	{"selected": ["Node.js", "PostgreSQL", "API Design", "Event-Driven Architecture"]}	Interested in ledger and payment-switch engineering roles.	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	2	Product Manager	{FinCore,FinOps}	{"selected": ["Product Discovery", "SQL", "Reconciliation", "Stakeholder Management"]}	Wants to lead squad delivery and move into fintech product roles.	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
3	3	Data Engineer	{FinOps,FinInfra}	{"selected": ["Python", "dbt", "Kafka", "Data Modelling"]}	Focused on automated reconciliation and financial data pipelines.	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: sprint_deliverables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sprint_deliverables (id, sprint_id, user_id, title, description, evidence_url, status, score, feedback, submitted_at, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
1	2	3	Gateway authorisation ingestion	Webhook ingestion with signature verification and replay protection for gateway authorisations.	https://github.com/bluespace-demo/reconciliation/sprint-1-ingest	accepted	85	Signature verification is correct. Add dead-letter handling for malformed events.	2026-10-24 22:16:52.091532+00	7	2026-10-24 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	2	1	Ledger schema and posting service	Draft double-entry schema, posting API and invariant assertions covering multi-currency rounding.	https://github.com/bluespace-demo/reconciliation/sprint-1	accepted	90	Solid schema and clean posting service. Rounding rules are documented.	2026-10-24 22:16:52.091532+00	7	2026-10-24 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
4	3	1	Reconciliation matcher and break report	Fuzzy matcher for gateway vs settlement records, plus a break report grouped by timing, amount and duplicate.	https://github.com/bluespace-demo/reconciliation/sprint-2	submitted	\N	\N	2026-11-07 22:16:52.091532+00	\N	\N	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
3	3	2	Operator dashboard for reconciliation breaks	Dashboard that lists open breaks, ageing and owner assignment with CSV export.	https://github.com/bluespace-demo/reconciliation/sprint-2-ui	submitted	\N	\N	2026-11-08 22:16:52.091532+00	7	2026-11-09 22:39:13.588689+00	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: sprints; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sprints (id, use_case_id, squad_id, sprint_number, start_date, end_date, status, uat_completed, created_at, updated_at) FROM stdin;
1	1	1	3	2026-11-02	2026-11-09	planned	f	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
2	1	1	1	2026-10-19	2026-10-26	completed	t	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
3	1	1	2	2026-10-26	2026-11-02	active	f	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00
\.


--
-- Data for Name: squads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.squads (id, cohort_id, name, squad_lead_id, created_at, updated_at) FROM stdin;
1	1	Squad Alpha (Payment Rails)	2	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.083826+00
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submissions (id, user_id, lab_id, assessment_id, squad_id, status, content_url, score, feedback, graded_by, graded_at, submitted_at, created_at, updated_at) FROM stdin;
2	1	1	\N	1	graded	https://github.com/bluespace-demo/ledger-posting/pull/12	92	Clean double-entry implementation with explicit balance assertions and idempotent inserts. Add a concurrency test for the next sprint.	7	2026-10-31 22:16:52.091532+00	2026-10-31 22:16:52.091532+00	2026-10-31 22:16:52.091532+00	2026-10-31 22:16:52.091532+00
3	3	2	\N	1	graded	https://github.com/bluespace-demo/payment-switch/pull/7	88	Idempotency key storage and replay protection are correct. Consider surfacing the cached response body on replay.	7	2026-11-01 22:16:52.091532+00	2026-11-01 22:16:52.091532+00	2026-11-01 22:16:52.091532+00	2026-11-01 22:16:52.091532+00
4	1	\N	1	1	passed	https://github.com/bluespace-demo/fincore-capstone	91	Strong invariant checks and reconciliation reporting. All sprint evidence is linked and reproducible.	10	2026-11-04 22:16:52.091532+00	2026-11-04 22:16:52.091532+00	2026-11-04 22:16:52.091532+00	2026-11-04 22:16:52.091532+00
5	2	\N	1	1	submitted	https://github.com/bluespace-demo/fincore-capstone-ada	\N	\N	\N	\N	2026-11-08 22:16:52.091532+00	2026-11-08 22:16:52.091532+00	2026-11-09 22:18:11.047958+00
1	2	1	\N	1	submitted	https://github.com/bluespace-demo/ledger-posting/pull/19	\N	\N	\N	\N	2026-11-07 22:16:52.091532+00	2026-11-07 22:16:52.091532+00	2026-11-09 22:39:00.710336+00
\.


--
-- Data for Name: use_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.use_cases (id, cohort_id, domain, title, description, stakeholder, sandbox_access, anonymised_data, confidentiality_terms, status, created_by, created_at, updated_at, squad_id) FROM stdin;
1	1	FinCore	Real-Time Ledger Reconciliation for Multi-Currency Payments	Design and prototype a reconciliation service that matches gateway authorisations, bank settlements and ledger postings across NGN, GHS and USD rails, surfacing timing, amount and duplicate breaks within a five-minute window.	TrustNet Africa — Payments Operations	t	t	Use only the provided anonymised sandbox extracts. Do not export transaction data outside the academy environment.	assigned	10	2026-11-09 22:16:52.091532+00	2026-11-09 22:16:52.091532+00	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, type, avatar, phone, is_active, force_password_change, last_login_at, partner_id, student_id, created_at, updated_at, auth_user_id) FROM stdin;
1	Test Student	student@bluespacefintechacademy.com	\N	Student	/avatars/student.png	\N	1	0	\N	\N	BS-2026-0042	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	fd2e47bb-61e9-4575-9269-19dced9e00da
2	Ada Okonkwo	ada.okonkwo@bluespacefintechacademy.com	\N	Student	/avatars/ada.png	\N	1	0	\N	\N	BS-2026-0018	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	e2087cbc-4a81-4b83-a94b-b0ca661a0b66
3	Kwame Asante	kwame.asante@bluespacefintechacademy.com	\N	Student	/avatars/kwame.png	\N	1	0	\N	\N	BS-2026-0023	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	07b27fe0-0269-4c45-957d-ba2a28661909
4	Zainab Yusuf	zainab.yusuf@bluespacefintechacademy.com	\N	Student	/avatars/zainab.png	\N	1	0	\N	\N	BS-2026-0031	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	2c4f05d3-f8ed-4502-8ebc-6a89cadbe2af
5	Emeka Ndiaye	emeka.ndiaye@bluespacefintechacademy.com	\N	Student	/avatars/emeka.png	\N	1	0	\N	\N	BS-2026-0037	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	b152782b-657c-4bfd-b3b7-b4f920226ff6
6	Fatima Diallo	fatima.diallo@bluespacefintechacademy.com	\N	Student	/avatars/fatima.png	\N	1	0	\N	\N	BS-2026-0040	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	8a27139a-721a-4592-b479-7dffb0bf5c13
7	FinCore Domain Lead	fin.core@bluespacefintechacademy.com	\N	Instructor	/avatars/fincore.png	\N	1	0	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	e40b79f0-be38-4d81-a8a4-f2af1dc9eacb
8	FaaS Domain Lead	faas.domain@bluespacefintechacademy.com	\N	Instructor	/avatars/faas.png	\N	1	0	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	697d87c5-b7cd-4a0d-bb13-1f55b6b1959c
9	FinOps Domain Lead	finops.domain@bluespacefintechacademy.com	\N	Instructor	/avatars/finops.png	\N	1	0	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	4b4452dc-daa1-4acc-bc6a-a0d3f6c67246
10	Academy Team Lead	academy.lead@bluespacefintechacademy.com	\N	Administrator	/avatars/lead.png	\N	1	0	\N	\N	\N	2026-11-06 11:57:16.083826+00	2026-11-06 11:57:16.527837+00	1d2d2c2c-9ece-4391-bd4e-cf1ace4af14f
21	TrustNet Partner	partner@bluespacefintechacademy.com	\N	Partner	avatar.png	\N	1	0	\N	1	\N	2026-11-06 11:57:16.527837+00	2026-11-06 11:57:16.62819+00	45e3aaaa-08c9-46af-84b1-27b78c2da597
\.


--
-- Name: academy_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.academy_applications_id_seq', 3, true);


--
-- Name: announcement_reads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announcement_reads_id_seq', 2, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, true);


--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assessment_attempts_id_seq', 1, true);


--
-- Name: assessment_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assessment_questions_id_seq', 6, true);


--
-- Name: assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assessments_id_seq', 3, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 5, true);


--
-- Name: certifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certifications_id_seq', 3, true);


--
-- Name: clinic_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clinic_bookings_id_seq', 3, true);


--
-- Name: clinics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clinics_id_seq', 2, true);


--
-- Name: cohorts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cohorts_id_seq', 2, true);


--
-- Name: enrolments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enrolments_id_seq', 6, true);


--
-- Name: google_integrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.google_integrations_id_seq', 1, false);


--
-- Name: instructor_cohort_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instructor_cohort_assignments_id_seq', 3, true);


--
-- Name: instructor_squad_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instructor_squad_assignments_id_seq', 3, true);


--
-- Name: labs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.labs_id_seq', 2, true);


--
-- Name: lesson_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lesson_progress_id_seq', 22, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lessons_id_seq', 7, true);


--
-- Name: live_class_attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.live_class_attendance_id_seq', 11, true);


--
-- Name: live_classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.live_classes_id_seq', 2, true);


--
-- Name: mentor_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mentor_evaluations_id_seq', 3, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modules_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 19, true);


--
-- Name: partner_course_enrolments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partner_course_enrolments_id_seq', 14, true);


--
-- Name: partner_course_lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partner_course_lessons_id_seq', 6, true);


--
-- Name: partner_course_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partner_course_progress_id_seq', 3, true);


--
-- Name: partner_courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partner_courses_id_seq', 2, true);


--
-- Name: partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partners_id_seq', 4, true);


--
-- Name: peer_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_reviews_id_seq', 2, true);


--
-- Name: placements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.placements_id_seq', 2, true);


--
-- Name: skills_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.skills_profiles_id_seq', 3, true);


--
-- Name: sprint_deliverables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sprint_deliverables_id_seq', 4, true);


--
-- Name: sprints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sprints_id_seq', 3, true);


--
-- Name: squads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.squads_id_seq', 1, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.submissions_id_seq', 5, true);


--
-- Name: use_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.use_cases_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 21, true);


--
-- Name: academy_applications academy_applications_auth_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academy_applications
    ADD CONSTRAINT academy_applications_auth_user_id_key UNIQUE (auth_user_id);


--
-- Name: academy_applications academy_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academy_applications
    ADD CONSTRAINT academy_applications_pkey PRIMARY KEY (id);


--
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assessment_attempts assessment_attempts_assessment_id_user_id_started_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_assessment_id_user_id_started_at_key UNIQUE (assessment_id, user_id, started_at);


--
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (id);


--
-- Name: assessment_questions assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: clinic_bookings clinic_bookings_clinic_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_bookings
    ADD CONSTRAINT clinic_bookings_clinic_id_user_id_key UNIQUE (clinic_id, user_id);


--
-- Name: clinic_bookings clinic_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_bookings
    ADD CONSTRAINT clinic_bookings_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: cohorts cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);


--
-- Name: enrolments enrolments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrolments
    ADD CONSTRAINT enrolments_pkey PRIMARY KEY (id);


--
-- Name: google_integrations google_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_integrations
    ADD CONSTRAINT google_integrations_pkey PRIMARY KEY (id);


--
-- Name: google_integrations google_integrations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_integrations
    ADD CONSTRAINT google_integrations_user_id_key UNIQUE (user_id);


--
-- Name: instructor_cohort_assignments instructor_cohort_assignments_instructor_id_cohort_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_cohort_assignments
    ADD CONSTRAINT instructor_cohort_assignments_instructor_id_cohort_id_key UNIQUE (instructor_id, cohort_id);


--
-- Name: instructor_cohort_assignments instructor_cohort_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_cohort_assignments
    ADD CONSTRAINT instructor_cohort_assignments_pkey PRIMARY KEY (id);


--
-- Name: instructor_squad_assignments instructor_squad_assignments_instructor_id_squad_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_squad_assignments
    ADD CONSTRAINT instructor_squad_assignments_instructor_id_squad_id_key UNIQUE (instructor_id, squad_id);


--
-- Name: instructor_squad_assignments instructor_squad_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_squad_assignments
    ADD CONSTRAINT instructor_squad_assignments_pkey PRIMARY KEY (id);


--
-- Name: labs labs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.labs
    ADD CONSTRAINT labs_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: live_class_attendance live_class_attendance_live_class_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_class_attendance
    ADD CONSTRAINT live_class_attendance_live_class_id_user_id_key UNIQUE (live_class_id, user_id);


--
-- Name: live_class_attendance live_class_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_class_attendance
    ADD CONSTRAINT live_class_attendance_pkey PRIMARY KEY (id);


--
-- Name: live_classes live_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_pkey PRIMARY KEY (id);


--
-- Name: mentor_evaluations mentor_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_evaluations
    ADD CONSTRAINT mentor_evaluations_pkey PRIMARY KEY (id);


--
-- Name: mentor_evaluations mentor_evaluations_sprint_id_user_id_mentor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_evaluations
    ADD CONSTRAINT mentor_evaluations_sprint_id_user_id_mentor_id_key UNIQUE (sprint_id, user_id, mentor_id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partner_course_enrolments partner_course_enrolments_course_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_enrolments
    ADD CONSTRAINT partner_course_enrolments_course_id_user_id_key UNIQUE (course_id, user_id);


--
-- Name: partner_course_enrolments partner_course_enrolments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_enrolments
    ADD CONSTRAINT partner_course_enrolments_pkey PRIMARY KEY (id);


--
-- Name: partner_course_lessons partner_course_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_lessons
    ADD CONSTRAINT partner_course_lessons_pkey PRIMARY KEY (id);


--
-- Name: partner_course_progress partner_course_progress_lesson_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_progress
    ADD CONSTRAINT partner_course_progress_lesson_id_user_id_key UNIQUE (lesson_id, user_id);


--
-- Name: partner_course_progress partner_course_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_progress
    ADD CONSTRAINT partner_course_progress_pkey PRIMARY KEY (id);


--
-- Name: partner_courses partner_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_courses
    ADD CONSTRAINT partner_courses_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: partners partners_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_slug_key UNIQUE (slug);


--
-- Name: peer_reviews peer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_pkey PRIMARY KEY (id);


--
-- Name: peer_reviews peer_reviews_submission_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_submission_id_reviewer_id_key UNIQUE (submission_id, reviewer_id);


--
-- Name: placements placements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placements
    ADD CONSTRAINT placements_pkey PRIMARY KEY (id);


--
-- Name: skills_profiles skills_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills_profiles
    ADD CONSTRAINT skills_profiles_pkey PRIMARY KEY (id);


--
-- Name: skills_profiles skills_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills_profiles
    ADD CONSTRAINT skills_profiles_user_id_key UNIQUE (user_id);


--
-- Name: sprint_deliverables sprint_deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprint_deliverables
    ADD CONSTRAINT sprint_deliverables_pkey PRIMARY KEY (id);


--
-- Name: sprints sprints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_pkey PRIMARY KEY (id);


--
-- Name: squads squads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.squads
    ADD CONSTRAINT squads_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: use_cases use_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.use_cases
    ADD CONSTRAINT use_cases_pkey PRIMARY KEY (id);


--
-- Name: users users_auth_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: announcement_reads_announcement_user_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX announcement_reads_announcement_user_key ON public.announcement_reads USING btree (announcement_id, user_id);


--
-- Name: idx_academy_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academy_applications_status ON public.academy_applications USING btree (status, created_at DESC);


--
-- Name: idx_announcements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_created_at ON public.announcements USING btree (created_at DESC);


--
-- Name: idx_assessments_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessments_module ON public.assessments USING btree (module_id);


--
-- Name: idx_attempts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user ON public.assessment_attempts USING btree (user_id, assessment_id);


--
-- Name: idx_certifications_certificate_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_certifications_certificate_number ON public.certifications USING btree (certificate_number) WHERE (certificate_number IS NOT NULL);


--
-- Name: idx_certifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certifications_user ON public.certifications USING btree (user_id);


--
-- Name: idx_certifications_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_certifications_verification_token ON public.certifications USING btree (verification_token) WHERE (verification_token IS NOT NULL);


--
-- Name: idx_clinic_bookings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_bookings_user ON public.clinic_bookings USING btree (user_id);


--
-- Name: idx_clinics_cohort_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_cohort_start ON public.clinics USING btree (cohort_id, starts_at);


--
-- Name: idx_cohorts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cohorts_status ON public.cohorts USING btree (status);


--
-- Name: idx_deliverables_sprint_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliverables_sprint_user ON public.sprint_deliverables USING btree (sprint_id, user_id);


--
-- Name: idx_enrolments_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrolments_cohort ON public.enrolments USING btree (cohort_id);


--
-- Name: idx_enrolments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrolments_user ON public.enrolments USING btree (user_id);


--
-- Name: idx_instructor_cohort_assignments_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructor_cohort_assignments_instructor ON public.instructor_cohort_assignments USING btree (instructor_id);


--
-- Name: idx_instructor_squad_assignments_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructor_squad_assignments_instructor ON public.instructor_squad_assignments USING btree (instructor_id);


--
-- Name: idx_labs_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_labs_lesson ON public.labs USING btree (lesson_id);


--
-- Name: idx_lesson_progress_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_completed ON public.lesson_progress USING btree (is_completed);


--
-- Name: idx_lesson_progress_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress USING btree (lesson_id);


--
-- Name: idx_lesson_progress_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);


--
-- Name: idx_lessons_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_module ON public.lessons USING btree (module_id);


--
-- Name: idx_live_class_attendance_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_live_class_attendance_user ON public.live_class_attendance USING btree (user_id);


--
-- Name: idx_live_classes_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_live_classes_cohort ON public.live_classes USING btree (cohort_id);


--
-- Name: idx_live_classes_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_live_classes_starts_at ON public.live_classes USING btree (starts_at);


--
-- Name: idx_modules_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_cohort ON public.modules USING btree (cohort_id);


--
-- Name: idx_modules_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_stage ON public.modules USING btree (stage);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_partner_course_lessons_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_course_lessons_course ON public.partner_course_lessons USING btree (course_id, order_index);


--
-- Name: idx_partner_courses_partner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_courses_partner ON public.partner_courses USING btree (partner_id);


--
-- Name: idx_partner_courses_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_partner_courses_slug ON public.partner_courses USING btree (slug);


--
-- Name: idx_partner_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_courses_status ON public.partner_courses USING btree (status);


--
-- Name: idx_placements_certification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_placements_certification ON public.placements USING btree (certification_id);


--
-- Name: idx_placements_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_placements_user ON public.placements USING btree (user_id);


--
-- Name: idx_sprints_squad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sprints_squad ON public.sprints USING btree (squad_id);


--
-- Name: idx_sprints_use_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sprints_use_case ON public.sprints USING btree (use_case_id);


--
-- Name: idx_squads_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_squads_cohort ON public.squads USING btree (cohort_id);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);


--
-- Name: idx_submissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user ON public.submissions USING btree (user_id);


--
-- Name: idx_use_cases_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_use_cases_cohort ON public.use_cases USING btree (cohort_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_type ON public.users USING btree (type);


--
-- Name: submissions enforce_student_submission_update_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_student_submission_update_trigger BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.enforce_student_submission_update();


--
-- Name: clinic_bookings notify_clinic_booked_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_clinic_booked_trigger AFTER INSERT ON public.clinic_bookings FOR EACH ROW EXECUTE FUNCTION public.notify_clinic_booked();


--
-- Name: submissions notify_submission_created_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_submission_created_trigger AFTER INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.notify_submission_created();


--
-- Name: submissions notify_submission_graded_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_submission_graded_trigger AFTER UPDATE OF status ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.notify_submission_graded();


--
-- Name: assessments set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: certifications set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: clinics set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cohorts set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: enrolments set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.enrolments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: labs set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.labs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: lessons set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: modules set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: notifications set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: placements set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.placements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: sprints set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sprints FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: squads set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: submissions set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: use_cases set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.use_cases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: users set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: academy_applications academy_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academy_applications
    ADD CONSTRAINT academy_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: academy_applications academy_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academy_applications
    ADD CONSTRAINT academy_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_reads announcement_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: assessment_attempts assessment_attempts_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: assessment_questions assessment_questions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessments assessments_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: certifications certifications_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: certifications certifications_partner_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_partner_course_id_fkey FOREIGN KEY (partner_course_id) REFERENCES public.partner_courses(id) ON DELETE SET NULL;


--
-- Name: certifications certifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: clinic_bookings clinic_bookings_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_bookings
    ADD CONSTRAINT clinic_bookings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_bookings clinic_bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_bookings
    ADD CONSTRAINT clinic_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: clinics clinics_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;


--
-- Name: clinics clinics_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: enrolments enrolments_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrolments
    ADD CONSTRAINT enrolments_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: enrolments enrolments_squad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrolments
    ADD CONSTRAINT enrolments_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id);


--
-- Name: enrolments enrolments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrolments
    ADD CONSTRAINT enrolments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs fk_audit_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications fk_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: google_integrations google_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_integrations
    ADD CONSTRAINT google_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_cohort_assignments instructor_cohort_assignments_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_cohort_assignments
    ADD CONSTRAINT instructor_cohort_assignments_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;


--
-- Name: instructor_cohort_assignments instructor_cohort_assignments_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_cohort_assignments
    ADD CONSTRAINT instructor_cohort_assignments_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_squad_assignments instructor_squad_assignments_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_squad_assignments
    ADD CONSTRAINT instructor_squad_assignments_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_squad_assignments instructor_squad_assignments_squad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_squad_assignments
    ADD CONSTRAINT instructor_squad_assignments_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE CASCADE;


--
-- Name: labs labs_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.labs
    ADD CONSTRAINT labs_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: lesson_progress lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: live_class_attendance live_class_attendance_live_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_class_attendance
    ADD CONSTRAINT live_class_attendance_live_class_id_fkey FOREIGN KEY (live_class_id) REFERENCES public.live_classes(id) ON DELETE CASCADE;


--
-- Name: live_class_attendance live_class_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_class_attendance
    ADD CONSTRAINT live_class_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: live_classes live_classes_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;


--
-- Name: live_classes live_classes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: live_classes live_classes_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: live_classes live_classes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;


--
-- Name: mentor_evaluations mentor_evaluations_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_evaluations
    ADD CONSTRAINT mentor_evaluations_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(id);


--
-- Name: mentor_evaluations mentor_evaluations_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_evaluations
    ADD CONSTRAINT mentor_evaluations_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.sprints(id) ON DELETE CASCADE;


--
-- Name: mentor_evaluations mentor_evaluations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_evaluations
    ADD CONSTRAINT mentor_evaluations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: modules modules_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: partner_course_enrolments partner_course_enrolments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_enrolments
    ADD CONSTRAINT partner_course_enrolments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.partner_courses(id) ON DELETE CASCADE;


--
-- Name: partner_course_enrolments partner_course_enrolments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_enrolments
    ADD CONSTRAINT partner_course_enrolments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: partner_course_lessons partner_course_lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_lessons
    ADD CONSTRAINT partner_course_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.partner_courses(id) ON DELETE CASCADE;


--
-- Name: partner_course_progress partner_course_progress_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_progress
    ADD CONSTRAINT partner_course_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.partner_courses(id) ON DELETE CASCADE;


--
-- Name: partner_course_progress partner_course_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_progress
    ADD CONSTRAINT partner_course_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.partner_course_lessons(id) ON DELETE CASCADE;


--
-- Name: partner_course_progress partner_course_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_course_progress
    ADD CONSTRAINT partner_course_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: partner_courses partner_courses_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_courses
    ADD CONSTRAINT partner_courses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: partner_courses partner_courses_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_courses
    ADD CONSTRAINT partner_courses_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;


--
-- Name: partner_courses partner_courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_courses
    ADD CONSTRAINT partner_courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: partner_courses partner_courses_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_courses
    ADD CONSTRAINT partner_courses_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partners partners_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: partners partners_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: peer_reviews peer_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_reviews peer_reviews_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;


--
-- Name: placements placements_certification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placements
    ADD CONSTRAINT placements_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES public.certifications(id);


--
-- Name: placements placements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placements
    ADD CONSTRAINT placements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: skills_profiles skills_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills_profiles
    ADD CONSTRAINT skills_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sprint_deliverables sprint_deliverables_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprint_deliverables
    ADD CONSTRAINT sprint_deliverables_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: sprint_deliverables sprint_deliverables_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprint_deliverables
    ADD CONSTRAINT sprint_deliverables_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.sprints(id) ON DELETE CASCADE;


--
-- Name: sprint_deliverables sprint_deliverables_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprint_deliverables
    ADD CONSTRAINT sprint_deliverables_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sprints sprints_squad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id);


--
-- Name: sprints sprints_use_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_use_case_id_fkey FOREIGN KEY (use_case_id) REFERENCES public.use_cases(id);


--
-- Name: squads squads_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.squads
    ADD CONSTRAINT squads_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: squads squads_squad_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.squads
    ADD CONSTRAINT squads_squad_lead_id_fkey FOREIGN KEY (squad_lead_id) REFERENCES public.users(id);


--
-- Name: submissions submissions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);


--
-- Name: submissions submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: submissions submissions_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_lab_id_fkey FOREIGN KEY (lab_id) REFERENCES public.labs(id);


--
-- Name: submissions submissions_squad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id);


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: use_cases use_cases_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.use_cases
    ADD CONSTRAINT use_cases_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: use_cases use_cases_squad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.use_cases
    ADD CONSTRAINT use_cases_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE SET NULL;


--
-- Name: users users_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: announcements academy staff manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy staff manage announcements" ON public.announcements USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK ((((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])) AND (author_id = public.current_profile_id())));


--
-- Name: live_class_attendance academy staff manage attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy staff manage attendance" ON public.live_class_attendance USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: lessons academy staff manage lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy staff manage lessons" ON public.lessons USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: live_classes academy staff manage live classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy staff manage live classes" ON public.live_classes USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: modules academy staff manage modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy staff manage modules" ON public.modules USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: announcements academy users view announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy users view announcements" ON public.announcements FOR SELECT USING ((((audience)::text = 'all'::text) OR (((audience)::text = 'finsoft'::text) AND (EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.user_id = public.current_profile_id()) AND ((e.track)::text = 'Finsoft'::text))))) OR (((audience)::text = 'finops'::text) AND (EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.user_id = public.current_profile_id()) AND ((e.track)::text = 'Finops'::text)))))));


--
-- Name: partners academy users view approved partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy users view approved partners" ON public.partners FOR SELECT USING (((status)::text = 'approved'::text));


--
-- Name: lessons academy users view lessons for visible modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy users view lessons for visible modules" ON public.lessons FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.modules m
  WHERE ((m.id = lessons.module_id) AND (m.is_published OR ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])))))));


--
-- Name: modules academy users view published modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "academy users view published modules" ON public.modules FOR SELECT USING ((is_published OR ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))));


--
-- Name: academy_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academy_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: instructor_cohort_assignments administrators manage instructor assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "administrators manage instructor assignments" ON public.instructor_cohort_assignments USING (((public.current_profile_role())::text = 'Administrator'::text)) WITH CHECK (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: instructor_squad_assignments administrators manage instructor squad assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "administrators manage instructor squad assignments" ON public.instructor_squad_assignments USING (((public.current_profile_role())::text = 'Administrator'::text)) WITH CHECK (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: partner_courses administrators manage partner courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "administrators manage partner courses" ON public.partner_courses USING (((public.current_profile_role())::text = 'Administrator'::text)) WITH CHECK (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: partners administrators manage partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "administrators manage partners" ON public.partners USING (((public.current_profile_role())::text = 'Administrator'::text)) WITH CHECK (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: audit_logs administrators view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "administrators view audit logs" ON public.audit_logs FOR SELECT USING (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: announcement_reads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: academy_applications applicants view own application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "applicants view own application" ON public.academy_applications FOR SELECT USING ((auth_user_id = auth.uid()));


--
-- Name: assessment_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: assessment_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: assessments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: certifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: clinics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

--
-- Name: cohorts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

--
-- Name: enrolments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;

--
-- Name: google_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: instructor_cohort_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instructor_cohort_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: instructor_squad_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instructor_squad_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: labs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: live_class_attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.live_class_attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: live_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: mentor_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentor_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_course_enrolments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_course_enrolments ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_course_lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_course_lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_course_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_course_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_courses partners manage own courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "partners manage own courses" ON public.partner_courses USING ((partner_id = public.current_partner_id())) WITH CHECK ((partner_id = public.current_partner_id()));


--
-- Name: partner_course_lessons partners manage own lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "partners manage own lessons" ON public.partner_course_lessons USING ((EXISTS ( SELECT 1
   FROM public.partner_courses c
  WHERE ((c.id = partner_course_lessons.course_id) AND (c.partner_id = public.current_partner_id()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.partner_courses c
  WHERE ((c.id = partner_course_lessons.course_id) AND (c.partner_id = public.current_partner_id())))));


--
-- Name: partners partners view own organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "partners view own organization" ON public.partners FOR SELECT USING (((id = public.current_partner_id()) OR ((public.current_profile_role())::text = 'Administrator'::text)));


--
-- Name: peer_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: placements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

--
-- Name: submissions reviewers view assigned submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "reviewers view assigned submissions" ON public.submissions FOR SELECT USING ((id IN ( SELECT public.reviewable_submission_ids() AS reviewable_submission_ids)));


--
-- Name: skills_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.skills_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sprint_deliverables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sprint_deliverables ENABLE ROW LEVEL SECURITY;

--
-- Name: sprints; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

--
-- Name: sprint_deliverables squad members view project evidence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "squad members view project evidence" ON public.sprint_deliverables FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.sprints s
  WHERE ((s.id = sprint_deliverables.sprint_id) AND (s.squad_id IN ( SELECT public.current_squad_ids() AS current_squad_ids))))));


--
-- Name: sprints squad members view sprints; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "squad members view sprints" ON public.sprints FOR SELECT USING ((squad_id IN ( SELECT e.squad_id
   FROM public.enrolments e
  WHERE (e.user_id = public.current_profile_id()))));


--
-- Name: squads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

--
-- Name: submissions staff grade submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff grade submissions" ON public.submissions FOR UPDATE USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: academy_applications staff manage academy applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage academy applications" ON public.academy_applications USING (((public.current_profile_role())::text = 'Administrator'::text)) WITH CHECK (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: assessment_questions staff manage assessment questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage assessment questions" ON public.assessment_questions USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: assessments staff manage assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage assessments" ON public.assessments USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: certifications staff manage certifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage certifications" ON public.certifications USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: clinics staff manage clinics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage clinics" ON public.clinics USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: cohorts staff manage cohorts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage cohorts" ON public.cohorts USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: enrolments staff manage enrolments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage enrolments" ON public.enrolments USING (((public.current_profile_role())::text = 'Administrator'::text)) WITH CHECK (((public.current_profile_role())::text = 'Administrator'::text));


--
-- Name: labs staff manage labs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage labs" ON public.labs USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: mentor_evaluations staff manage mentor evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage mentor evaluations" ON public.mentor_evaluations USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: peer_reviews staff manage peer reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage peer reviews" ON public.peer_reviews USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: placements staff manage placements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage placements" ON public.placements USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: sprint_deliverables staff manage project evidence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage project evidence" ON public.sprint_deliverables USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: sprints staff manage sprints; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage sprints" ON public.sprints USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: squads staff manage squads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage squads" ON public.squads USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: use_cases staff manage use cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage use cases" ON public.use_cases USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))) WITH CHECK (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: assessment_attempts staff view assessment attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view assessment attempts" ON public.assessment_attempts FOR SELECT USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: clinic_bookings staff view clinic bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view clinic bookings" ON public.clinic_bookings FOR SELECT USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: enrolments staff view enrolments for monitoring; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view enrolments for monitoring" ON public.enrolments FOR SELECT USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: lesson_progress staff view lesson progress for monitoring; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view lesson progress for monitoring" ON public.lesson_progress FOR SELECT USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: instructor_cohort_assignments staff view own cohort assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view own cohort assignments" ON public.instructor_cohort_assignments FOR SELECT USING (((instructor_id = public.current_profile_id()) OR ((public.current_profile_role())::text = 'Administrator'::text)));


--
-- Name: instructor_squad_assignments staff view own squad assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view own squad assignments" ON public.instructor_squad_assignments FOR SELECT USING (((instructor_id = public.current_profile_id()) OR ((public.current_profile_role())::text = 'Administrator'::text)));


--
-- Name: skills_profiles staff view skills profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view skills profiles" ON public.skills_profiles FOR SELECT USING (((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])));


--
-- Name: submissions students create own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students create own submissions" ON public.submissions FOR INSERT WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: lesson_progress students manage own lesson progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students manage own lesson progress" ON public.lesson_progress USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: sprint_deliverables students manage own project evidence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students manage own project evidence" ON public.sprint_deliverables USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: partner_course_enrolments students manage partner enrolments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students manage partner enrolments" ON public.partner_course_enrolments USING (((user_id = public.current_profile_id()) OR ((public.current_profile_role())::text = ANY ((ARRAY['Administrator'::character varying, 'Partner'::character varying])::text[])))) WITH CHECK (((user_id = public.current_profile_id()) OR ((public.current_profile_role())::text = ANY ((ARRAY['Administrator'::character varying, 'Partner'::character varying])::text[]))));


--
-- Name: partner_course_progress students manage partner progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students manage partner progress" ON public.partner_course_progress USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: notifications students update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students update own notifications" ON public.notifications FOR UPDATE USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: submissions students update own ungraded submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students update own ungraded submissions" ON public.submissions FOR UPDATE USING (((user_id = public.current_profile_id()) AND ((status)::text <> 'graded'::text) AND (graded_at IS NULL))) WITH CHECK (((user_id = public.current_profile_id()) AND ((status)::text = 'submitted'::text) AND (score IS NULL) AND (feedback IS NULL) AND (graded_by IS NULL) AND (graded_at IS NULL)));


--
-- Name: use_cases students view assigned use cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view assigned use cases" ON public.use_cases FOR SELECT USING ((squad_id IN ( SELECT e.squad_id
   FROM public.enrolments e
  WHERE (e.user_id = public.current_profile_id()))));


--
-- Name: live_classes students view cohort classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view cohort classes" ON public.live_classes FOR SELECT USING ((((visibility)::text = 'cohort'::text) AND (EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.user_id = public.current_profile_id()) AND (e.cohort_id = live_classes.cohort_id) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[])))))));


--
-- Name: clinics students view cohort clinics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view cohort clinics" ON public.clinics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.user_id = public.current_profile_id()) AND (e.cohort_id = clinics.cohort_id) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[]))))));


--
-- Name: cohorts students view enrolled cohorts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view enrolled cohorts" ON public.cohorts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.user_id = public.current_profile_id()) AND (e.cohort_id = cohorts.id) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[]))))));


--
-- Name: labs students view labs for visible modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view labs for visible modules" ON public.labs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.lessons l
     JOIN public.modules m ON ((m.id = l.module_id)))
     JOIN public.enrolments e ON ((e.cohort_id = m.cohort_id)))
  WHERE ((l.id = labs.lesson_id) AND m.is_published AND (e.user_id = public.current_profile_id()) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[]))))));


--
-- Name: live_class_attendance students view own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view own attendance" ON public.live_class_attendance FOR SELECT USING ((user_id = public.current_profile_id()));


--
-- Name: enrolments students view own enrolments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view own enrolments" ON public.enrolments FOR SELECT USING ((user_id = public.current_profile_id()));


--
-- Name: notifications students view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view own notifications" ON public.notifications FOR SELECT USING ((user_id = public.current_profile_id()));


--
-- Name: placements students view own placement; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view own placement" ON public.placements FOR SELECT USING ((user_id = public.current_profile_id()));


--
-- Name: squads students view own squad; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view own squad" ON public.squads FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.squad_id = squads.id) AND (e.user_id = public.current_profile_id()) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[]))))));


--
-- Name: submissions students view own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view own submissions" ON public.submissions FOR SELECT USING (((user_id = public.current_profile_id()) OR ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))));


--
-- Name: assessment_questions students view published assessment questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view published assessment questions" ON public.assessment_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.assessments a
     JOIN public.modules m ON ((m.id = a.module_id)))
     JOIN public.enrolments e ON (((e.cohort_id = m.cohort_id) AND (e.user_id = public.current_profile_id()))))
  WHERE ((a.id = assessment_questions.assessment_id) AND a.is_published))));


--
-- Name: assessments students view published assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view published assessments" ON public.assessments FOR SELECT USING ((is_published AND (EXISTS ( SELECT 1
   FROM (public.modules m
     JOIN public.enrolments e ON ((e.cohort_id = m.cohort_id)))
  WHERE ((m.id = assessments.module_id) AND m.is_published AND (e.user_id = public.current_profile_id()) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[])))))));


--
-- Name: partner_courses students view published partner courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view published partner courses" ON public.partner_courses FOR SELECT USING ((((status)::text = 'published'::text) AND (EXISTS ( SELECT 1
   FROM public.enrolments e
  WHERE ((e.user_id = public.current_profile_id()) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[])) AND ((partner_courses.cohort_id IS NULL) OR (e.cohort_id = partner_courses.cohort_id)) AND ((partner_courses.track IS NULL) OR ((partner_courses.track)::text = 'All'::text) OR ((e.track)::text = (partner_courses.track)::text)))))));


--
-- Name: partner_course_lessons students view published partner lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view published partner lessons" ON public.partner_course_lessons FOR SELECT USING ((is_published AND (EXISTS ( SELECT 1
   FROM public.partner_courses c
  WHERE ((c.id = partner_course_lessons.course_id) AND ((c.status)::text = 'published'::text) AND (EXISTS ( SELECT 1
           FROM public.enrolments e
          WHERE ((e.user_id = public.current_profile_id()) AND ((e.status)::text = ANY ((ARRAY['enrolled'::character varying, 'active'::character varying, 'completed'::character varying])::text[])) AND ((c.cohort_id IS NULL) OR (e.cohort_id = c.cohort_id)) AND ((c.track IS NULL) OR ((c.track)::text = 'All'::text) OR ((e.track)::text = (c.track)::text))))))))));


--
-- Name: enrolments students view squad enrolments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view squad enrolments" ON public.enrolments FOR SELECT USING (((user_id = public.current_profile_id()) OR ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[])) OR (squad_id IN ( SELECT public.current_squad_ids() AS current_squad_ids))));


--
-- Name: users students view squad profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "students view squad profiles" ON public.users FOR SELECT USING ((id IN ( SELECT public.current_squad_member_ids() AS current_squad_member_ids)));


--
-- Name: submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: use_cases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: announcement_reads users manage own announcement reads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users manage own announcement reads" ON public.announcement_reads USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: assessment_attempts users manage own assessment attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users manage own assessment attempts" ON public.assessment_attempts USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: clinic_bookings users manage own clinic bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users manage own clinic bookings" ON public.clinic_bookings USING (((user_id = public.current_profile_id()) AND (EXISTS ( SELECT 1
   FROM (public.clinics c
     JOIN public.enrolments e ON ((e.cohort_id = c.cohort_id)))
  WHERE ((c.id = clinic_bookings.clinic_id) AND (e.user_id = public.current_profile_id())))))) WITH CHECK (((user_id = public.current_profile_id()) AND (EXISTS ( SELECT 1
   FROM (public.clinics c
     JOIN public.enrolments e ON ((e.cohort_id = c.cohort_id)))
  WHERE ((c.id = clinic_bookings.clinic_id) AND (e.user_id = public.current_profile_id()))))));


--
-- Name: google_integrations users manage own google integration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users manage own google integration" ON public.google_integrations USING ((user_id = public.current_profile_id())) WITH CHECK (((user_id = public.current_profile_id()) AND ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))));


--
-- Name: skills_profiles users manage own skills profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users manage own skills profile" ON public.skills_profiles USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: peer_reviews users update own assigned peer reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users update own assigned peer reviews" ON public.peer_reviews FOR UPDATE USING ((reviewer_id = public.current_profile_id())) WITH CHECK ((reviewer_id = public.current_profile_id()));


--
-- Name: notifications users update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE USING ((user_id = public.current_profile_id())) WITH CHECK ((user_id = public.current_profile_id()));


--
-- Name: users users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users update own profile" ON public.users FOR UPDATE USING ((id = public.current_profile_id())) WITH CHECK ((id = public.current_profile_id()));


--
-- Name: peer_reviews users view assigned peer reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view assigned peer reviews" ON public.peer_reviews FOR SELECT USING ((reviewer_id = public.current_profile_id()));


--
-- Name: certifications users view own certifications or staff view certifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view own certifications or staff view certifications" ON public.certifications FOR SELECT USING (((user_id = public.current_profile_id()) OR ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))));


--
-- Name: mentor_evaluations users view own mentor evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view own mentor evaluations" ON public.mentor_evaluations FOR SELECT USING ((user_id = public.current_profile_id()));


--
-- Name: notifications users view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view own notifications" ON public.notifications FOR SELECT USING ((user_id = public.current_profile_id()));


--
-- Name: users users view own profile or staff view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view own profile or staff view profiles" ON public.users FOR SELECT USING (((auth_user_id = auth.uid()) OR (lower((email)::text) = lower(auth.email())) OR ((public.current_profile_role())::text = ANY ((ARRAY['Instructor'::character varying, 'Administrator'::character varying])::text[]))));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION assign_partner_user(p_user_id bigint, p_partner_id bigint); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_partner_user(p_user_id bigint, p_partner_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_partner_user(p_user_id bigint, p_partner_id bigint) TO anon;
GRANT ALL ON FUNCTION public.assign_partner_user(p_user_id bigint, p_partner_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.assign_partner_user(p_user_id bigint, p_partner_id bigint) TO service_role;


--
-- Name: FUNCTION clear_my_force_password_change(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.clear_my_force_password_change() FROM PUBLIC;
GRANT ALL ON FUNCTION public.clear_my_force_password_change() TO anon;
GRANT ALL ON FUNCTION public.clear_my_force_password_change() TO authenticated;
GRANT ALL ON FUNCTION public.clear_my_force_password_change() TO service_role;


--
-- Name: FUNCTION create_notification(p_user_id bigint, p_type text, p_data text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_notification(p_user_id bigint, p_type text, p_data text) TO anon;
GRANT ALL ON FUNCTION public.create_notification(p_user_id bigint, p_type text, p_data text) TO authenticated;
GRANT ALL ON FUNCTION public.create_notification(p_user_id bigint, p_type text, p_data text) TO service_role;


--
-- Name: FUNCTION current_partner_id(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.current_partner_id() TO anon;
GRANT ALL ON FUNCTION public.current_partner_id() TO authenticated;
GRANT ALL ON FUNCTION public.current_partner_id() TO service_role;


--
-- Name: FUNCTION current_profile_id(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.current_profile_id() TO anon;
GRANT ALL ON FUNCTION public.current_profile_id() TO authenticated;
GRANT ALL ON FUNCTION public.current_profile_id() TO service_role;


--
-- Name: FUNCTION current_profile_role(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.current_profile_role() TO anon;
GRANT ALL ON FUNCTION public.current_profile_role() TO authenticated;
GRANT ALL ON FUNCTION public.current_profile_role() TO service_role;


--
-- Name: FUNCTION current_squad_ids(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.current_squad_ids() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_squad_ids() TO anon;
GRANT ALL ON FUNCTION public.current_squad_ids() TO authenticated;
GRANT ALL ON FUNCTION public.current_squad_ids() TO service_role;


--
-- Name: FUNCTION current_squad_member_ids(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.current_squad_member_ids() TO anon;
GRANT ALL ON FUNCTION public.current_squad_member_ids() TO authenticated;
GRANT ALL ON FUNCTION public.current_squad_member_ids() TO service_role;


--
-- Name: FUNCTION enforce_student_submission_update(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.enforce_student_submission_update() TO anon;
GRANT ALL ON FUNCTION public.enforce_student_submission_update() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_student_submission_update() TO service_role;


--
-- Name: FUNCTION handle_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;
GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;


--
-- Name: TABLE certifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.certifications TO anon;
GRANT ALL ON TABLE public.certifications TO authenticated;
GRANT ALL ON TABLE public.certifications TO service_role;


--
-- Name: FUNCTION issue_certificate(p_certification_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.issue_certificate(p_certification_id bigint) TO anon;
GRANT ALL ON FUNCTION public.issue_certificate(p_certification_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.issue_certificate(p_certification_id bigint) TO service_role;


--
-- Name: FUNCTION issue_partner_certificate(p_user_id bigint, p_course_id bigint, p_final_grade numeric); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.issue_partner_certificate(p_user_id bigint, p_course_id bigint, p_final_grade numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.issue_partner_certificate(p_user_id bigint, p_course_id bigint, p_final_grade numeric) TO anon;
GRANT ALL ON FUNCTION public.issue_partner_certificate(p_user_id bigint, p_course_id bigint, p_final_grade numeric) TO authenticated;
GRANT ALL ON FUNCTION public.issue_partner_certificate(p_user_id bigint, p_course_id bigint, p_final_grade numeric) TO service_role;


--
-- Name: FUNCTION notify_clinic_booked(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.notify_clinic_booked() TO anon;
GRANT ALL ON FUNCTION public.notify_clinic_booked() TO authenticated;
GRANT ALL ON FUNCTION public.notify_clinic_booked() TO service_role;


--
-- Name: FUNCTION notify_submission_created(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.notify_submission_created() TO anon;
GRANT ALL ON FUNCTION public.notify_submission_created() TO authenticated;
GRANT ALL ON FUNCTION public.notify_submission_created() TO service_role;


--
-- Name: FUNCTION notify_submission_graded(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.notify_submission_graded() TO anon;
GRANT ALL ON FUNCTION public.notify_submission_graded() TO authenticated;
GRANT ALL ON FUNCTION public.notify_submission_graded() TO service_role;


--
-- Name: FUNCTION review_academy_application(p_application_id bigint, p_decision character varying, p_cohort_id bigint, p_track character varying, p_reason text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.review_academy_application(p_application_id bigint, p_decision character varying, p_cohort_id bigint, p_track character varying, p_reason text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.review_academy_application(p_application_id bigint, p_decision character varying, p_cohort_id bigint, p_track character varying, p_reason text) TO anon;
GRANT ALL ON FUNCTION public.review_academy_application(p_application_id bigint, p_decision character varying, p_cohort_id bigint, p_track character varying, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.review_academy_application(p_application_id bigint, p_decision character varying, p_cohort_id bigint, p_track character varying, p_reason text) TO service_role;


--
-- Name: TABLE sprint_deliverables; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sprint_deliverables TO anon;
GRANT ALL ON TABLE public.sprint_deliverables TO authenticated;
GRANT ALL ON TABLE public.sprint_deliverables TO service_role;


--
-- Name: FUNCTION review_sprint_deliverable(p_deliverable_id bigint, p_score integer, p_feedback text, p_status character varying); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.review_sprint_deliverable(p_deliverable_id bigint, p_score integer, p_feedback text, p_status character varying) TO anon;
GRANT ALL ON FUNCTION public.review_sprint_deliverable(p_deliverable_id bigint, p_score integer, p_feedback text, p_status character varying) TO authenticated;
GRANT ALL ON FUNCTION public.review_sprint_deliverable(p_deliverable_id bigint, p_score integer, p_feedback text, p_status character varying) TO service_role;


--
-- Name: FUNCTION reviewable_submission_ids(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.reviewable_submission_ids() FROM PUBLIC;
GRANT ALL ON FUNCTION public.reviewable_submission_ids() TO anon;
GRANT ALL ON FUNCTION public.reviewable_submission_ids() TO authenticated;
GRANT ALL ON FUNCTION public.reviewable_submission_ids() TO service_role;


--
-- Name: FUNCTION verify_certificate(p_token uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.verify_certificate(p_token uuid) TO anon;
GRANT ALL ON FUNCTION public.verify_certificate(p_token uuid) TO authenticated;
GRANT ALL ON FUNCTION public.verify_certificate(p_token uuid) TO service_role;


--
-- Name: TABLE academy_applications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.academy_applications TO anon;
GRANT ALL ON TABLE public.academy_applications TO authenticated;
GRANT ALL ON TABLE public.academy_applications TO service_role;


--
-- Name: SEQUENCE academy_applications_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.academy_applications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.academy_applications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.academy_applications_id_seq TO service_role;


--
-- Name: TABLE announcement_reads; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.announcement_reads TO anon;
GRANT ALL ON TABLE public.announcement_reads TO authenticated;
GRANT ALL ON TABLE public.announcement_reads TO service_role;


--
-- Name: SEQUENCE announcement_reads_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.announcement_reads_id_seq TO anon;
GRANT ALL ON SEQUENCE public.announcement_reads_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.announcement_reads_id_seq TO service_role;


--
-- Name: TABLE announcements; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.announcements TO anon;
GRANT ALL ON TABLE public.announcements TO authenticated;
GRANT ALL ON TABLE public.announcements TO service_role;


--
-- Name: SEQUENCE announcements_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.announcements_id_seq TO anon;
GRANT ALL ON SEQUENCE public.announcements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.announcements_id_seq TO service_role;


--
-- Name: TABLE assessment_attempts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assessment_attempts TO anon;
GRANT ALL ON TABLE public.assessment_attempts TO authenticated;
GRANT ALL ON TABLE public.assessment_attempts TO service_role;


--
-- Name: SEQUENCE assessment_attempts_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.assessment_attempts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assessment_attempts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assessment_attempts_id_seq TO service_role;


--
-- Name: TABLE assessment_questions; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.assessment_questions TO anon;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.assessment_questions TO authenticated;
GRANT ALL ON TABLE public.assessment_questions TO service_role;


--
-- Name: COLUMN assessment_questions.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.assessment_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(assessment_id) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.prompt; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(prompt) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.question_type; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(question_type) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.options; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(options) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.points; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(points) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.order_index; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(order_index) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_at) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: COLUMN assessment_questions.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(updated_at) ON TABLE public.assessment_questions TO authenticated;


--
-- Name: SEQUENCE assessment_questions_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.assessment_questions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assessment_questions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assessment_questions_id_seq TO service_role;


--
-- Name: TABLE assessments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assessments TO anon;
GRANT ALL ON TABLE public.assessments TO authenticated;
GRANT ALL ON TABLE public.assessments TO service_role;


--
-- Name: SEQUENCE assessments_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.assessments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assessments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assessments_id_seq TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO service_role;


--
-- Name: SEQUENCE certifications_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.certifications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.certifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.certifications_id_seq TO service_role;


--
-- Name: TABLE clinic_bookings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.clinic_bookings TO anon;
GRANT ALL ON TABLE public.clinic_bookings TO authenticated;
GRANT ALL ON TABLE public.clinic_bookings TO service_role;


--
-- Name: SEQUENCE clinic_bookings_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.clinic_bookings_id_seq TO anon;
GRANT ALL ON SEQUENCE public.clinic_bookings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.clinic_bookings_id_seq TO service_role;


--
-- Name: TABLE clinics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.clinics TO anon;
GRANT ALL ON TABLE public.clinics TO authenticated;
GRANT ALL ON TABLE public.clinics TO service_role;


--
-- Name: SEQUENCE clinics_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.clinics_id_seq TO anon;
GRANT ALL ON SEQUENCE public.clinics_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.clinics_id_seq TO service_role;


--
-- Name: TABLE cohorts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cohorts TO anon;
GRANT ALL ON TABLE public.cohorts TO authenticated;
GRANT ALL ON TABLE public.cohorts TO service_role;


--
-- Name: SEQUENCE cohorts_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.cohorts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cohorts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cohorts_id_seq TO service_role;


--
-- Name: TABLE enrolments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.enrolments TO anon;
GRANT ALL ON TABLE public.enrolments TO authenticated;
GRANT ALL ON TABLE public.enrolments TO service_role;


--
-- Name: SEQUENCE enrolments_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.enrolments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.enrolments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.enrolments_id_seq TO service_role;


--
-- Name: TABLE google_integrations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.google_integrations TO anon;
GRANT ALL ON TABLE public.google_integrations TO authenticated;
GRANT ALL ON TABLE public.google_integrations TO service_role;


--
-- Name: SEQUENCE google_integrations_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.google_integrations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.google_integrations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.google_integrations_id_seq TO service_role;


--
-- Name: TABLE instructor_cohort_assignments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.instructor_cohort_assignments TO anon;
GRANT ALL ON TABLE public.instructor_cohort_assignments TO authenticated;
GRANT ALL ON TABLE public.instructor_cohort_assignments TO service_role;


--
-- Name: SEQUENCE instructor_cohort_assignments_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.instructor_cohort_assignments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.instructor_cohort_assignments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.instructor_cohort_assignments_id_seq TO service_role;


--
-- Name: TABLE instructor_squad_assignments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.instructor_squad_assignments TO anon;
GRANT ALL ON TABLE public.instructor_squad_assignments TO authenticated;
GRANT ALL ON TABLE public.instructor_squad_assignments TO service_role;


--
-- Name: SEQUENCE instructor_squad_assignments_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.instructor_squad_assignments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.instructor_squad_assignments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.instructor_squad_assignments_id_seq TO service_role;


--
-- Name: TABLE labs; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.labs TO anon;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.labs TO authenticated;
GRANT ALL ON TABLE public.labs TO service_role;


--
-- Name: COLUMN labs.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.lesson_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(lesson_id) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.title; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(title) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.instructions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(instructions) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.starter_code; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(starter_code) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.due_date; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(due_date) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.max_score; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(max_score) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.track_specific; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(track_specific) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.created_by; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_by) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_at) ON TABLE public.labs TO authenticated;


--
-- Name: COLUMN labs.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(updated_at) ON TABLE public.labs TO authenticated;


--
-- Name: SEQUENCE labs_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.labs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.labs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.labs_id_seq TO service_role;


--
-- Name: TABLE lesson_progress; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_progress TO anon;
GRANT ALL ON TABLE public.lesson_progress TO authenticated;
GRANT ALL ON TABLE public.lesson_progress TO service_role;


--
-- Name: SEQUENCE lesson_progress_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.lesson_progress_id_seq TO anon;
GRANT ALL ON SEQUENCE public.lesson_progress_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.lesson_progress_id_seq TO service_role;


--
-- Name: TABLE lessons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lessons TO anon;
GRANT ALL ON TABLE public.lessons TO authenticated;
GRANT ALL ON TABLE public.lessons TO service_role;


--
-- Name: SEQUENCE lessons_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.lessons_id_seq TO anon;
GRANT ALL ON SEQUENCE public.lessons_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.lessons_id_seq TO service_role;


--
-- Name: TABLE live_class_attendance; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.live_class_attendance TO anon;
GRANT ALL ON TABLE public.live_class_attendance TO authenticated;
GRANT ALL ON TABLE public.live_class_attendance TO service_role;


--
-- Name: SEQUENCE live_class_attendance_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.live_class_attendance_id_seq TO anon;
GRANT ALL ON SEQUENCE public.live_class_attendance_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.live_class_attendance_id_seq TO service_role;


--
-- Name: TABLE live_classes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.live_classes TO anon;
GRANT ALL ON TABLE public.live_classes TO authenticated;
GRANT ALL ON TABLE public.live_classes TO service_role;


--
-- Name: SEQUENCE live_classes_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.live_classes_id_seq TO anon;
GRANT ALL ON SEQUENCE public.live_classes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.live_classes_id_seq TO service_role;


--
-- Name: TABLE mentor_evaluations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mentor_evaluations TO anon;
GRANT ALL ON TABLE public.mentor_evaluations TO authenticated;
GRANT ALL ON TABLE public.mentor_evaluations TO service_role;


--
-- Name: SEQUENCE mentor_evaluations_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.mentor_evaluations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.mentor_evaluations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.mentor_evaluations_id_seq TO service_role;


--
-- Name: TABLE modules; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.modules TO anon;
GRANT ALL ON TABLE public.modules TO authenticated;
GRANT ALL ON TABLE public.modules TO service_role;


--
-- Name: SEQUENCE modules_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.modules_id_seq TO anon;
GRANT ALL ON SEQUENCE public.modules_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.modules_id_seq TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: SEQUENCE notifications_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.notifications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO service_role;


--
-- Name: TABLE partner_course_enrolments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partner_course_enrolments TO anon;
GRANT ALL ON TABLE public.partner_course_enrolments TO authenticated;
GRANT ALL ON TABLE public.partner_course_enrolments TO service_role;


--
-- Name: SEQUENCE partner_course_enrolments_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.partner_course_enrolments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.partner_course_enrolments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.partner_course_enrolments_id_seq TO service_role;


--
-- Name: TABLE partner_course_lessons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partner_course_lessons TO anon;
GRANT ALL ON TABLE public.partner_course_lessons TO authenticated;
GRANT ALL ON TABLE public.partner_course_lessons TO service_role;


--
-- Name: SEQUENCE partner_course_lessons_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.partner_course_lessons_id_seq TO anon;
GRANT ALL ON SEQUENCE public.partner_course_lessons_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.partner_course_lessons_id_seq TO service_role;


--
-- Name: TABLE partner_course_progress; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partner_course_progress TO anon;
GRANT ALL ON TABLE public.partner_course_progress TO authenticated;
GRANT ALL ON TABLE public.partner_course_progress TO service_role;


--
-- Name: SEQUENCE partner_course_progress_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.partner_course_progress_id_seq TO anon;
GRANT ALL ON SEQUENCE public.partner_course_progress_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.partner_course_progress_id_seq TO service_role;


--
-- Name: TABLE partner_courses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partner_courses TO anon;
GRANT ALL ON TABLE public.partner_courses TO authenticated;
GRANT ALL ON TABLE public.partner_courses TO service_role;


--
-- Name: SEQUENCE partner_courses_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.partner_courses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.partner_courses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.partner_courses_id_seq TO service_role;


--
-- Name: TABLE partners; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partners TO anon;
GRANT ALL ON TABLE public.partners TO authenticated;
GRANT ALL ON TABLE public.partners TO service_role;


--
-- Name: SEQUENCE partners_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.partners_id_seq TO anon;
GRANT ALL ON SEQUENCE public.partners_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.partners_id_seq TO service_role;


--
-- Name: TABLE peer_reviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.peer_reviews TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.peer_reviews TO authenticated;
GRANT ALL ON TABLE public.peer_reviews TO service_role;


--
-- Name: COLUMN peer_reviews.score; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(score) ON TABLE public.peer_reviews TO authenticated;


--
-- Name: COLUMN peer_reviews.feedback; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(feedback) ON TABLE public.peer_reviews TO authenticated;


--
-- Name: COLUMN peer_reviews.status; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(status) ON TABLE public.peer_reviews TO authenticated;


--
-- Name: COLUMN peer_reviews.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(updated_at) ON TABLE public.peer_reviews TO authenticated;


--
-- Name: SEQUENCE peer_reviews_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.peer_reviews_id_seq TO anon;
GRANT ALL ON SEQUENCE public.peer_reviews_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.peer_reviews_id_seq TO service_role;


--
-- Name: TABLE placements; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.placements TO anon;
GRANT ALL ON TABLE public.placements TO authenticated;
GRANT ALL ON TABLE public.placements TO service_role;


--
-- Name: SEQUENCE placements_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.placements_id_seq TO anon;
GRANT ALL ON SEQUENCE public.placements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.placements_id_seq TO service_role;


--
-- Name: TABLE skills_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.skills_profiles TO anon;
GRANT ALL ON TABLE public.skills_profiles TO authenticated;
GRANT ALL ON TABLE public.skills_profiles TO service_role;


--
-- Name: SEQUENCE skills_profiles_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.skills_profiles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.skills_profiles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.skills_profiles_id_seq TO service_role;


--
-- Name: SEQUENCE sprint_deliverables_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.sprint_deliverables_id_seq TO anon;
GRANT ALL ON SEQUENCE public.sprint_deliverables_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.sprint_deliverables_id_seq TO service_role;


--
-- Name: TABLE sprints; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sprints TO anon;
GRANT ALL ON TABLE public.sprints TO authenticated;
GRANT ALL ON TABLE public.sprints TO service_role;


--
-- Name: SEQUENCE sprints_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.sprints_id_seq TO anon;
GRANT ALL ON SEQUENCE public.sprints_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.sprints_id_seq TO service_role;


--
-- Name: TABLE squads; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.squads TO anon;
GRANT ALL ON TABLE public.squads TO authenticated;
GRANT ALL ON TABLE public.squads TO service_role;


--
-- Name: SEQUENCE squads_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.squads_id_seq TO anon;
GRANT ALL ON SEQUENCE public.squads_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.squads_id_seq TO service_role;


--
-- Name: TABLE submissions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.submissions TO anon;
GRANT ALL ON TABLE public.submissions TO authenticated;
GRANT ALL ON TABLE public.submissions TO service_role;


--
-- Name: SEQUENCE submissions_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.submissions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.submissions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.submissions_id_seq TO service_role;


--
-- Name: TABLE use_cases; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.use_cases TO anon;
GRANT ALL ON TABLE public.use_cases TO authenticated;
GRANT ALL ON TABLE public.use_cases TO service_role;


--
-- Name: SEQUENCE use_cases_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.use_cases_id_seq TO anon;
GRANT ALL ON SEQUENCE public.use_cases_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.use_cases_id_seq TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: COLUMN users.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.name; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(name),UPDATE(name) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.email; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(email) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.type; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(type) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.avatar; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(avatar),UPDATE(avatar) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.phone; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(phone),UPDATE(phone) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.is_active; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(is_active) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.force_password_change; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(force_password_change) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.last_login_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(last_login_at) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.partner_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(partner_id) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.student_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(student_id) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_at) ON TABLE public.users TO authenticated;


--
-- Name: COLUMN users.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(updated_at) ON TABLE public.users TO authenticated;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--


