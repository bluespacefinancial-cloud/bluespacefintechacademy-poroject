HOW TO LOAD AND SEE THE BLUESPACE DEMO DATA
===========================================

Folder: sql-to-run/

READ THIS FIRST
---------------
STEP3 only LOOKS at the database. It changes nothing, so running it can
never make data appear. It is a diagnostic.

STEP5 is the file that actually loads the data AND creates the logins.

If the app looks empty, the answer is: run STEP5.


------------------------------------------------------------
THE ONE THING TO DO
------------------------------------------------------------
1. Open the Supabase dashboard for project dsipoxbmztvlgowyznkl.
2. Go to SQL Editor -> New query.
3. Open  sql-to-run/STEP5_LOGINS_AND_VERIFY.sql
4. Copy the whole file, paste it into the editor, press Run.
5. Wait for it to finish. It prints a report at the bottom with
   sections A and B. Section B should show 11 accounts, each with
   "type=" set and "auth_user_id=" set.

That single file does all of this:
  - loads every demo cohort, module, lesson, lab, live class, clinic,
    announcement, notification, enrolment, partner and partner course
  - creates 11 Supabase Auth logins (confirmed, password already set)
  - links every login to its public.users profile via auth_user_id
  - puts the instructors on the demo cohort and squad
  - assigns the partner login to the TrustNet organisation
  - enrols the demo students on the published partner courses
  - prints a verification report

It is safe to run more than once.

The SQL Editor needs no service key. It already runs with full rights.


------------------------------------------------------------
THEN SIGN IN
------------------------------------------------------------
All demo accounts use the same password:

    BlueSpace2026!

    Role           Page               Email
    ------------   ----------------   ------------------------------------
    Student        /student-login     student@bluespacefintechacademy.com
    Student        /student-login     ada.okonkwo@bluespacefintechacademy.com
    Student        /student-login     kwame.asante@bluespacefintechacademy.com
    Student        /student-login     zainab.yusuf@bluespacefintechacademy.com
    Student        /student-login     emeka.ndiaye@bluespacefintechacademy.com
    Student        /student-login     fatima.diallo@bluespacefintechacademy.com
    Instructor     /instructor-login  fin.core@bluespacefintechacademy.com
    Instructor     /instructor-login  faas.domain@bluespacefintechacademy.com
    Instructor     /instructor-login  finops.domain@bluespacefintechacademy.com
    Administrator  /admin-login       academy.lead@bluespacefintechacademy.com
    Partner        /partner-login     partner@bluespacefintechacademy.com

What each role will see once signed in (verified against the real RLS
policies):

  Student  1 cohort, 4 modules, 7 lessons, 6 enrolments, 2 live classes,
           2 clinics, 1 announcement, 4 notifications, 3 partner lessons
  Instructor  2 cohorts, 4 modules, 7 lessons, 6 enrolments, 2 live
           classes, 2 clinics, their cohort assignment
  Admin     everything, including all 3 instructor assignments
  Partner   TrustNet's own courses and 3 partner lessons, 4 modules,
           7 lessons, 1 announcement


------------------------------------------------------------
MAKE SURE THE APP IS CONNECTED TO SUPABASE
------------------------------------------------------------
Local development is already configured: lms/client/.env exists.

    cd lms/client
    npm run dev
    open http://localhost:3000

For Vercel, a .env file on your machine does not reach it. Add both
variables in Vercel -> Settings -> Environment Variables, then redeploy:

    VITE_SUPABASE_URL      = https://dsipoxbmztvlgowyznkl.supabase.co
    VITE_SUPABASE_ANON_KEY = the publishable key in lms/client/.env.example

The existing build in lms/client/dist was rebuilt with these values.


------------------------------------------------------------
IF IT IS STILL EMPTY AFTER STEP5
------------------------------------------------------------
Run sql-to-run/STEP3_WHY_NOT_VISIBLE.sql and send back the single table
it returns. It is read only. It will show exactly which table or which
account link is missing.

Optional: to attach a login you already use to a demo profile, edit
v_email at line 18 of sql-to-run/STEP4_LINK_MY_ACCOUNT.sql and run it.
