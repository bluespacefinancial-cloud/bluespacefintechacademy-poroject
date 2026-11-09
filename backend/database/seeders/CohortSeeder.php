<?php

namespace Database\Seeders;

use App\Models\Cohort;
use Illuminate\Database\Seeder;

class CohortSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\Cohort::factory()->count(2)->create([
            'track_finsoft' => true,
            'track_finops' => true,
            'status' => 'active',
        ]);
    }
}
