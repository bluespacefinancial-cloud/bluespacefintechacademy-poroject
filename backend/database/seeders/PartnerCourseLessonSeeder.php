<?php

namespace Database\Seeders;

use App\Models\PartnerCourse;
use App\Models\PartnerCourseLesson;
use Illuminate\Database\Seeder;

class PartnerCourseLessonSeeder extends Seeder
{
    public function run(): void
    {
        PartnerCourse::all()->each(function ($course) {
            PartnerCourseLesson::factory()->count(rand(3, 8))->create([
                'course_id' => $course->id,
            ]);
        });
    }
}
