<?php

namespace Database\Factories;

use App\Models\UseCase;
use Illuminate\Database\Eloquent\Factories\Factory;

class UseCaseFactory extends Factory
{
    protected $model = UseCase::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'domain' => $this->faker->randomElement(['FaaS', 'FinCore', 'FinOps', 'FinInfra']),
            'status' => $this->faker->randomElement(['draft', 'assigned', 'completed', 'archived']),
            'is_published' => $this->faker->boolean(),
        ];
    }
}
