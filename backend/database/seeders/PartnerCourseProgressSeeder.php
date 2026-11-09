<?php

namespace Database\Seeders;

use App\Models\PartnerCourseEnrolment;
use App\Models\PartnerCourseLesson;
use App\Models\PartnerCourseProgress;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PartnerCourseProgressSeeder extends Seeder
{
    public function run(): void
    {
        PartnerCourseEnrolment::all()->each(function ($enrolment) {
            $courseLessons = PartnerCourseLesson::where('course_id', $enrolment->partner_course_id)->get();
            $courseLessons->each(function ($lesson) use ($enrolment) {
                PartnerCourseProgress::factory()->create([
                    'partner_course_enrolment_id' => $enrolment->id,
                    'lesson_id' => $lesson->id,
                    'is_completed' => Hash::make(rand(0, 1)) % 2 === 0,
                ]);
            });
        });
    }
}
