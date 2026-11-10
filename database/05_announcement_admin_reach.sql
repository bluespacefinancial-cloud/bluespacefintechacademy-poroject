-- 05_announcement_admin_reach.sql
--
-- Apply after 04_partner_review_guard.sql.
--
-- `announcements` had a single staff policy whose WITH CHECK required
-- `author_id = current_profile_id()`. That is correct for instructors, but it
-- also applied to administrators, so an administrator could not correct or pin
-- an announcement written by someone else. Administrators are the editor of
-- last resort everywhere else, so they get the same reach here.
--
-- The instructor rule is unchanged: they still only write their own rows.

BEGIN;

DROP POLICY IF EXISTS "administrators manage all announcements" ON public.announcements;
CREATE POLICY "administrators manage all announcements" ON public.announcements
  FOR ALL
  USING ((public.current_profile_role())::text = 'Administrator')
  WITH CHECK ((public.current_profile_role())::text = 'Administrator');

COMMIT;
