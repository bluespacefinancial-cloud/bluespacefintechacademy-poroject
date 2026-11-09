<?php

namespace Database\Seeders;

use App\Models\PartnerCourse;
use App\Models\PartnerCourseEnrolment;
use App\Models\User;
use Illuminate\Database\Seeder;

class PartnerCourseEnrolmentSeeder extends Seeder
{
    public function run(): void
    {
        PartnerCourse::all()->each(function ($course) {
            User::where('type', 'Student')
                ->inRandomOrder()
                ->limit(rand(1, 5))
                ->each(function ($student) use ($course) {
                    PartnerCourseEnrolment::factory()->create([
                        'partner_course_id' => $course->id,
                        'user_id' => $student->id,
                    ]);
                });
        });
    }
}
