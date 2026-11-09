<?php

namespace Database\Seeders;

use App\Models\Squad;
use Illuminate\Database\Seeder;

class SquadSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\Squad::factory()->count(5)->create();
    }
}
