<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create students
        User::factory()->count(20)->create([
            'type' => 'Student',
            'is_active' => true,
        ]);

        // Create instructors
        User::factory()->count(5)->create([
            'type' => 'Instructor',
            'is_active' => 1,
        ]);

        // Create partners
        User::factory()->count(3)->create([
            'type' => 'Partner',
            'is_active' => 1,
        ]);

        // Create administrators
        User::factory()->count(2)->create([
            'type' => 'Administrator',
            'is_active' => 1,
        ]);

        // Create deactivated users for testing
        User::factory()->count(2)->create([
            'type' => 'Student',
            'is_active' => 0,
        ]);
    }
}
