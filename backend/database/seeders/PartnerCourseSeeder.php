<?php

namespace Database\Seeders;

use App\Models\PartnerCourse;
use App\Models\User;
use Illuminate\Database\Seeder;

class PartnerCourseSeeder extends Seeder
{
    public function run(): void
    {
        User::where('type', 'Partner')->each(function ($partner) {
            PartnerCourse::factory()->count(rand(1, 3))->create([
                'partner_id' => $partner->id,
            ]);
        });
    }
}
