<?php

namespace Database\Seeders;

use App\Models\PartnerCourseProgress;
use Illuminate\Database\Seeder;

class PartnerCourseProgressSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\PartnerCourseProgress::factory()->count(20)->create();
    }
}
