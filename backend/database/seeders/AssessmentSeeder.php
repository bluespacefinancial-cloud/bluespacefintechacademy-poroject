<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\Module;
use Illuminate\Database\Seeder;

class AssessmentSeeder extends Seeder
{
    public function run(): void
    {
        Module::all()->each(function ($module) {
            Assessment::factory()->count(rand(1, 3))->create([
                'module_id' => $module->id,
            ]);
        });
    }
}
