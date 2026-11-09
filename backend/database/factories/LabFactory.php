<?php

namespace Database\Factories;

use App\Models\Lab;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabFactory extends Factory
{
    protected $model = Lab::class;

    public function definition(): array
    {
        return [
            'lesson_id' => Lesson::factory(),
            'title' => $this->faker->sentence(4),
            'instructions' => $this->faker->paragraph(3),
            'starter_code' => 'class Solution {\n    // TODO: Implement solution\n}',
            'content_url' => null,
            'max_score' => $this->faker->numberBetween(50, 100),
            'due_date' => $this->faker->date('Y-m-d', '2027-12-31'),
        ];
    }
}
