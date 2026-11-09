<?php

namespace Database\Seeders;

use App\Models\PartnerCourseEnrolment;
use Illuminate\Database\Seeder;

class PartnerCourseEnrolmentSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\PartnerCourseEnrolment::factory()->count(15)->create();
    }
}
