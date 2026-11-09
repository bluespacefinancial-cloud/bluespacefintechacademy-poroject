<?php

namespace Database\Seeders;

use App\Models\PartnerCourseLesson;
use Illuminate\Database\Seeder;

class PartnerCourseLessonSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\PartnerCourseLesson::factory()->count(15)->create();
    }
}
