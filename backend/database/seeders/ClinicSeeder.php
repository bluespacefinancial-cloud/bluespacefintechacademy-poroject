<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Cohort;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClinicSeeder extends Seeder
{
    public function run(): void
    {
        Cohort::all()->each(function ($cohort) {
            Clinic::factory()->count(rand(1, 3))->create([
                'cohort_id' => $cohort->id,
                'mentor_id' => User::where('type', 'Instructor')->inRandomOrder()->first()->id ?? null,
            ]);
        });
    }
}
