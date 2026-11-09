<?php

namespace Database\Factories;

use App\Models\Clinic;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClinicFactory extends Factory
{
    protected $model = Clinic::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'cohort_id' => \App\Models\Cohort::factory(),
            'mentor_id' => \App\Models\User::factory()->where('type', 'Instructor')->first() ?? \App\Models\User::factory(),
            'starts_at' => $this->faker->dateTimeBetween('now', '+1 month'),
            'ends_at' => $this->faker->dateTimeBetween('+1 month', '+2 months'),
            'meet_url' => 'https://meet.google.com/' . $this->faker->uuid(),
            'capacity' => $this->faker->numberBetween(10, 30),
            'status' => $this->faker->randomElement(['scheduled', 'completed', 'cancelled']),
            'attendee_count' => $this->faker->numberBetween(0, 30),
            'created_by' => null,
        ];
    }
}
