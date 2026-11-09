<?php

namespace Database\Factories;

use App\Models\Assessment;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssessmentFactory extends Factory
{
    protected $model = Assessment::class;

    public function definition(): array
    {
        return [
            'module_id' => \App\Models\Module::factory(),
            'title' => $this->faker->sentence(4),
            'domain' => $this->faker->randomElement(['FaaS', 'FinCore', 'FinOps', 'FinInfra']),
            'status' => $this->faker->randomElement(['draft', 'published', 'completed', 'archived']),
            'is_published' => $this->faker->boolean(),
        ];
    }
}
