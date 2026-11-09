<?php

namespace Database\Factories;

use App\Models\Placement;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlacementFactory extends Factory
{
    protected $model = Placement::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'certification_id' => null,
            'company' => $this->faker->company(),
            'role' => $this->faker->jobTitle(),
            'location' => $this->faker->city(),
            'starts_at' => $this->faker->dateTimeBetween('now', '+1 month'),
            'ends_at' => $this->faker->optional()->dateTimeBetween('+1 month', '+1 year'),
            'status' => $this->faker->randomElement(['offered', 'accepted', 'active', 'completed']),
        ];
    }
}
