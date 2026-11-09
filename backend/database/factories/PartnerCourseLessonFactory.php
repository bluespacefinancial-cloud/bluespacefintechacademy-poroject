<?php

namespace Database\Factories;

use App\Models\PartnerCourseLesson;
use Illuminate\Database\Eloquent\Factories\Factory;

class PartnerCourseLessonFactory extends Factory
{
    protected $model = PartnerCourseLesson::class;

    public function definition(): array
    {
        return [
            'course_id' => \App\Models\PartnerCourse::factory(),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'video_url' => 'https://www.youtube.com/watch?v=' . $this->faker->regexify('[a-zA-Z0-9_-]{11}'),
            'order_index' => $this->faker->numberBetween(1, 10),
            'is_published' => $this->faker->boolean(),
        ];
    }
}
