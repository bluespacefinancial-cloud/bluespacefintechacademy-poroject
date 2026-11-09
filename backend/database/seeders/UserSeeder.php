<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\User::factory()->count(5)->create([
            'type' => 'Student',
            'is_active' => 1,
        ]);

        \App\Models\User::factory()->count(3)->create([
            'type' => 'Instructor',
            'is_active' => 1,
        ]);

        \App\Models\User::factory()->count(2)->create([
            'type' => 'Partner',
            'is_active' => 1,
        ]);

        \App\Models\User::factory()->count(1)->create([
            'type' => 'Administrator',
            'is_active' => 1,
        ]);
    }
}
