<?php

namespace Database\Factories;

use App\Models\Certification;
use Illuminate\Database\Eloquent\Factories\Factory;

class CertificationFactory extends Factory
{
    protected $model = Certification::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'title' => $this->faker->sentence(4),
            'type' => $this->faker->randomElement(['FaaS', 'FinCore', 'FinOps', 'FinInfra']),
            'issued_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'certificate_url' => 'https://example.com/cert/' . $this->faker->uuid(),
        ];
    }
}
