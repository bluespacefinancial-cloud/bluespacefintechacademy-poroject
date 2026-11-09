<?php

namespace Database\Seeders;

use App\Models\Lab;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class LabSeeder extends Seeder
{
    public function run(): void
    {
        Lesson::all()->each(function ($lesson) {
            Lab::factory()->count(rand(1, 3))->create([
                'lesson_id' => $lesson->id,
            ]);
        });
    }
}
