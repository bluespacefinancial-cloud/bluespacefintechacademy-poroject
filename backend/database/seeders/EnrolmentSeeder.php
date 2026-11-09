<?php

namespace Database\Seeders;

use App\Models\Cohort;
use App\Models\Enrolment;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnrolmentSeeder extends Seeder
{
    public function run(): void
    {
        $students = User::where('type', 'Student')->get();
        $cohorts = Cohort::all();

        foreach ($cohorts as $cohort) {
            $cohortStudents = $students->random(rand(3, 6));
            foreach ($cohortStudents as $student) {
                Enrolment::create([
                    'cohort_id' => $cohort->id,
                    'user_id' => $student->id,
                    'track' => fake()->randomElement(['Finsoft', 'Finops']),
                    'status' => $this->randomStatus(),
                    'squad_id' => null,
                ]);
            }
        }
    }

    private function randomStatus(): string
    {
        $statuses = ['enrolled', 'active', 'active', 'active', 'completed', 'withdrawn', 'suspended'];

        return fake()->randomElement($statuses);
    }
}
