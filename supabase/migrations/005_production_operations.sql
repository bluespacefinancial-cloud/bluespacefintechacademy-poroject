-- Production operations hardening for the internal academy.
-- Safe to run after migrations 001-004.

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage squads" ON public.squads;
DROP POLICY IF EXISTS "students view own squad" ON public.squads;
DROP POLICY IF EXISTS "staff manage placements" ON public.placements;
DROP POLICY IF EXISTS "students view own placement" ON public.placements;
DROP POLICY IF EXISTS "users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;

CREATE POLICY "staff manage squads"
  ON public.squads FOR ALL
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'))
  WITH CHECK (public.current_profile_role() IN ('Instructor', 'Administrator'));

CREATE POLICY "students view own squad"
  ON public.squads FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.enrolments e
      WHERE e.squad_id = squads.id
        AND e.user_id = public.current_profile_id()
        AND e.status IN ('enrolled', 'active', 'completed')
    )
  );

CREATE POLICY "staff manage placements"
  ON public.placements FOR ALL
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'))
  WITH CHECK (public.current_profile_role() IN ('Instructor', 'Administrator'));

CREATE POLICY "students view own placement"
  ON public.placements FOR SELECT
  USING (user_id = public.current_profile_id());

CREATE POLICY "users view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = public.current_profile_id());

CREATE POLICY "users update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

CREATE INDEX IF NOT EXISTS idx_placements_certification ON public.placements (certification_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id, is_read, created_at DESC);
