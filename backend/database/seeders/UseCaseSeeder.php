<?php

namespace Database\Seeders;

use App\Models\UseCase;
use Illuminate\Database\Seeder;

class UseCaseSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\UseCase::factory()->count(10)->create();
    }
}
