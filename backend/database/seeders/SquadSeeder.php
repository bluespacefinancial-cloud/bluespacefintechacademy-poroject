<?php

namespace Database\Seeders;

use App\Models\Cohort;
use App\Models\Squad;
use Illuminate\Database\Seeder;

class SquadSeeder extends Seeder
{
    public function run(): void
    {
        $cohorts = Cohort::all();

        foreach ($cohorts as $cohort) {
            $squads = Squad::factory()->count(rand(2, 4))->create([
                'cohort_id' => $cohort->id,
            ]);

            $squadEnrolments = $cohort->enrolments()->inRandomOrder()->limit(rand(3, 6))->get();

            foreach ($squads as $squad) {
                foreach ($squadEnrolments as $enrolment) {
                    $enrolment->squad_id = $squad->id;
                    $enrolment->save();
                }
            }
        }
    }
}
