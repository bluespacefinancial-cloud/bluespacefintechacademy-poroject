<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Database\Seeder;

class LessonSeeder extends Seeder
{
    public function run(): void
    {
        Module::all()->each(function ($module) {
            Lesson::factory()->count(rand(3, 8))->create([
                'module_id' => $module->id,
            ]);
        });
    }
}
