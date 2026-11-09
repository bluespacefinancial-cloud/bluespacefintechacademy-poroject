<?php

namespace Database\Factories;

use App\Models\Submission;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubmissionFactory extends Factory
{
    protected $model = Submission::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'lab_id' => \App\Models\Lab::factory(),
            'assessment_id' => null,
            'squad_id' => null,
            'status' => $this->faker->randomElement(['submitted', 'graded', 'remediation', 'failed']),
            'content_url' => 'https://github.com/user/lab-solution',
            'score' => $this->faker->optional()->numberBetween(60, 100),
            'feedback' => $this->faker->optional()->sentence(),
            'graded_by' => null,
            'submitted_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'graded_at' => null,
        ];
    }
}
