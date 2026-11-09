<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\UseCase;
use Illuminate\Database\Seeder;

class UseCaseSeeder extends Seeder
{
    public function run(): void
    {
        Module::all()->each(function ($module) {
            UseCase::factory()->count(rand(1, 3))->create([
                'module_id' => $module->id,
            ]);
        });
    }
}
