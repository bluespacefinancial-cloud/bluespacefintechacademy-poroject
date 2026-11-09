<?php

namespace Database\Seeders;

use App\Models\Cohort;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        Cohort::all()->each(function ($cohort) {
            Module::factory()->count(rand(4, 8))->create([
                'cohort_id' => $cohort->id,
            ])->each(function ($module) {
                Lesson::factory()->count(rand(3, 8))->create([
                    'module_id' => $module->id,
                ]);
            });
        });
    }
}
