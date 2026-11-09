<?php

namespace Database\Factories;

use App\Models\PartnerCourseProgress;
use Illuminate\Database\Eloquent\Factories\Factory;

class PartnerCourseProgressFactory extends Factory
{
    protected $model = PartnerCourseProgress::class;

    public function definition(): array
    {
        return [
            'partner_course_enrolment_id' => \App\Models\PartnerCourseEnrolment::factory(),
            'lesson_id' => \App\Models\PartnerCourseLesson::factory(),
            'is_completed' => $this->faker->boolean(),
        ];
    }
}
