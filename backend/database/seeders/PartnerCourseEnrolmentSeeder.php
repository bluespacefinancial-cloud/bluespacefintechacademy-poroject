<?php

namespace Database\Seeders;

use App\Models\PartnerCourseEnrolment;
use Illuminate\Database\Seeder;

class PartnerCourseEnrolmentSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\PartnerCourse::all()->each(function ($course) {
            \App\Models\User::where('type', 'Student')
                ->inRandomOrder()
                ->limit(rand(1, 5))
                ->each(function ($student) use ($course) {
                    \App\Models\PartnerCourseEnrolment::factory()->create([
                        'partner_course_id' => $course->id,
                        'user_id' => $student->id,
                    ]);
                });
            }
        }
    }
}