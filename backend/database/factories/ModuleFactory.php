<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

class ModuleFactory extends Factory
{
    protected $model = Module::class;

    public function definition(): array
    {
        return [
            'cohort_id' => \App\Models\Cohort::factory(),
            'title' => $this->faker->randomElement([
                'Introduction to FinCore Ledger Engineering',
                'Building Double-Entry Ledgers',
                'FaaS Architecture Patterns',
                'FinCore Domain Deep Dive',
                'FinOps Automation Strategies',
            ]),
            'stage' => $this->faker->randomElement(['foundations', 'domain_immersion', 'live_projects', 'certification']),
            'domain' => $this->faker->randomElement(['FaaS', 'FinCore', 'FinOps', 'FinInfra']),
            'track' => $this->faker->randomElement(['Finsoft', 'Finops', 'All']),
            'description' => $this->faker->sentence(),
            'week_start' => $this->faker->numberBetween(1, 4),
            'week_end' => $this->faker->numberBetween(5, 8),
            'is_published' => $this->faker->boolean(),
            'created_by' => null,
        ];
    }
}
