<?php

namespace Database\Seeders;

use App\Models\PartnerCourse;
use Illuminate\Database\Seeder;

class PartnerCourseSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\PartnerCourse::factory()->count(5)->create();
    }
}
