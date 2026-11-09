<?php

namespace Database\Factories;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'action' => $this->faker->randomElement(['create', 'update', 'delete', 'login', 'logout']),
            'model_type' => $this->faker->randomElement(['User', 'Cohort', 'Lab', 'Submission']),
            'model_id' => $this->faker->optional()->numberBetween(1, 100),
            'old_values' => $this->faker->optional()->json(),
            'new_values' => $this->faker->optional()->json(),
            'description' => $this->faker->sentence(),
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
