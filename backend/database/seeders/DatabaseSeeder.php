<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Users first (needed by almost everything)
        $this->call([
            UserSeeder::class,
        ]);

        // 2. Cohorts (needed by enrolments, modules, clinics)
        $this->call([
            CohortSeeder::class,
        ]);

        // 3. Enrolments (depends on cohorts + users)
        $this->call([
            EnrolmentSeeder::class,
        ]);

        // 4. Core learning content (depends on cohorts)
        $this->call([
            ModuleSeeder::class,
            LessonSeeder::class,
            LabSeeder::class,
            AssessmentSeeder::class,
            SubmissionSeeder::class,
        ]);

        // 5. Squads (depends on cohorts + users)
        $this->call([
            SquadSeeder::class,
        ]);

        // 6. Partner ecosystem
        $this->call([
            PartnerCourseSeeder::class,
            PartnerCourseLessonSeeder::class,
            PartnerCourseEnrolmentSeeder::class,
            PartnerCourseProgressSeeder::class,
        ]);

        // 7. Operations
        $this->call([
            UseCaseSeeder::class,
            SprintSeeder::class,
            CertificationSeeder::class,
            PlacementSeeder::class,
            ClinicSeeder::class,
        ]);

        // 8. Notifications & Audit
        $this->call([
            NotificationSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}
