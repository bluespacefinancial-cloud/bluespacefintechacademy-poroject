<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonFactory extends Factory
{
    protected $model = Lesson::class;

    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'title' => $this->faker->sentence(4),
            'type' => $this->faker->randomElement([
                'foundations', 'domain_immersion', 'live_projects', 'certification',
            ]),
            'duration_minutes' => $this->faker->numberBetween(30, 120),
            'content_url' => null,
            'video_url' => 'https://www.youtube.com/watch?v='.$this->faker->regexify('[a-zA-Z0-9_-]{11}'),
            'audio_url' => null,
            'thumbnail_url' => null,
            'caption_url' => null,
            'is_required' => $this->faker->boolean(80),
            'order_index' => $this->faker->numberBetween(1, 10),
            'created_by' => null,
        ];
    }
}
