<?php

namespace Database\Factories;

use App\Models\PartnerCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

class PartnerCourseFactory extends Factory
{
    protected $model = PartnerCourse::class;

    public function definition(): array
    {
        return [
            'partner_id' => \App\Models\User::factory()->create(['type' => 'Partner'])->id,
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'domain' => $this->faker->randomElement(['FaaS', 'FinCore', 'FinOps', 'FinInfra']),
            'status' => $this->faker->randomElement(['pending', 'approved', 'suspended']),
        ];
    }
}
