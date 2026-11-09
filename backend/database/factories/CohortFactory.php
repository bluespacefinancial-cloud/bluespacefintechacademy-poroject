<?php

namespace Database\Factories;

use App\Models\Cohort;
use Illuminate\Database\Eloquent\Factories\Factory;

class CohortFactory extends Factory
{
    protected $model = Cohort::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Cohort 1 - December 2026',
                'Cohort 2 - March 2027',
                'Cohort 3 - June 2027',
                'Cohort 4 - September 2027',
            ]),
            'start_date' => fake()->date('Y-m-d', '2026-12-01'),
            'end_date' => $this->faker->date('Y-m-d', '2027-09-01'),
            'capacity' => fake()->randomElement([20, 25, 30, 40, 50]),
            'status' => fake()->randomElement(['planned', 'active', 'completed']),
            'track_finsoft' => fake()->boolean(),
            'track_finops' => fake()->boolean(),
            'created_by' => null,
        ];
    }
}
