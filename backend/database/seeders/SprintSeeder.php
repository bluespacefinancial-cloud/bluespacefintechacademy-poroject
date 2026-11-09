<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Sprint;
use Illuminate\Database\Seeder;

class SprintSeeder extends Seeder
{
    public function run(): void
    {
        Module::all()->each(function ($module) {
            Sprint::factory()->count(rand(2, 4))->create([
                'module_id' => $module->id,
            ]);
        });
    }
}
