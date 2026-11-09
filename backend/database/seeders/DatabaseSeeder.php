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
        // Partner accounts first (users table foreign key)
        $this->call([
            PartnerCourseSeeder::class,
        ]);

        // Users (depends on partner_id foreign key)
        $this->call([
            UserSeeder::class,
        ]);

        // Core tables
        $this->call([
            CohortSeeder::class,
        ]);

        // Enrolments depend on cohorts + users
        $this->call([
            EnrolmentSeeder::class,
        ]);

        // Core learning content
        $this->call([
            ModuleSeeder::class,
            LessonSeeder::class,
            LabSeeder::class,
            AssessmentSeeder::class,
            SubmissionSeeder::class,
        ]);

        // Academic operations
        $this->call([
            SquadSeeder::class,
            SquadSeeder::class,
        ]);

        // Partner ecosystem
        $this->call([
            PartnerCourseSeeder::class,
            PartnerCourseLessonSeeder::class,
            PartnerCourseEnrolmentSeeder::class,
            PartnerCourseProgressSeeder::class,
        ]);

        // Operations
        $this->call([
            UseCaseSeeder::class,
            SprintSeeder::class,
            CertificationSeeder::class,
            PlacementSeeder::class,
            ReportSeeder::class,
            ClinicSeeder::class,
            ReportSeeder::class,
        ]);

        // Notifications & Audit
        $this->call([
            NotificationSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}
