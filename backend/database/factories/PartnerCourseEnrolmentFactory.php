<?php

namespace Database\Factories;

use App\Models\PartnerCourseEnrolment;
use Illuminate\Database\Eloquent\Factories\Factory;

class PartnerCourseEnrolmentFactory extends Factory
{
    protected $model = PartnerCourseEnrolment::class;

    public function definition(): array
    {
        return [
            'partner_course_id' => \App\Models\PartnerCourse::factory(),
            'user_id' => \App\Models\User::factory(),
        ];
    }
}
