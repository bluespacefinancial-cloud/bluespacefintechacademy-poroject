<?php

namespace Database\Factories;

use App\Models\Squad;
use Illuminate\Database\Eloquent\Factories\Factory;

class SquadFactory extends Factory
{
    protected $model = Squad::class;

    public function definition(): array
    {
        return [
            'cohort_id' => \App\Models\Cohort::factory(),
            'name' => $this->faker->randomElement([
                'Squad Alpha',
                'Squad Beta',
                'Squad Gamma',
                'Squad Delta',
            ]),
            'squad_lead_id' => null,
        ];
    }
}
