<?php

namespace Database\Seeders;

use App\Models\Enrolment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Seeder;

class EnrolmentSeeder extends Seeder
{
    public function run(): void
    {
        $students = \App\Models\User::where('type', 'Student')->get();
        $cohorts = \App\Models\Cohort::all();

        foreach ($cohorts as $cohort) {
            foreach ($students as $student) {
                \App\Models\Enrolment::factory()->create([
                    'cohort_id' => $cohort->id,
                    'user_id' => $student->id,
                    'track' => fake()->randomElement(['Finsoft', 'Finops']),
                ]);
            }
        }
    }
}
