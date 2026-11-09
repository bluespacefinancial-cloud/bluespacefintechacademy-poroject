<?php

namespace Database\Seeders;

use App\Models\Cohort;
use Illuminate\Database\Seeder;

class CohortSeeder extends Seeder
{
    public function run(): void
    {
        $cohorts = [
            [
                'name' => 'Cohort 2027 January',
                'start_date' => '2027-01-15',
                'end_date' => '2027-06-15',
                'capacity' => 50,
                'status' => 'active',
                'track_finsoft' => true,
                'track_finops' => true,
            ],
            [
                'name' => 'Cohort 2027 March',
                'start_date' => '2027-03-01',
                'end_date' => '2027-08-31',
                'capacity' => 60,
                'status' => 'active',
                'track_finsoft' => true,
                'track_finops' => true,
            ],
            [
                'name' => 'Cohort 2027 June',
                'start_date' => '2027-06-01',
                'end_date' => '2027-11-30',
                'capacity' => 45,
                'status' => 'planned',
                'track_finsoft' => true,
                'track_finops' => true,
            ],
        ];

        foreach ($cohorts as $cohortData) {
            Cohort::create($cohortData);
        }
    }
}
