<?php

namespace Database\Factories;

use App\Models\Enrolment;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnrolmentFactory extends Factory
{
    protected $model = Enrolment::class;

    public function definition(): array
    {
        return [
            'cohort_id' => \App\Models\Cohort::factory(),
            'user_id' => \App\Models\User::factory(),
            'track' => $this->faker->randomElement(['Finsoft', 'Finops']),
            'status' => $this->faker->randomElement(['enrolled', 'active', 'completed', 'withdrawn', 'suspended']),
            'squad_id' => null,
        ];
    }
}
