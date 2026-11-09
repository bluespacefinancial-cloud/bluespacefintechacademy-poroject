<?php

namespace Database\Seeders;

use App\Models\Placement;
use App\Models\User;
use Illuminate\Database\Seeder;

class PlacementSeeder extends Seeder
{
    public function run(): void
    {
        User::where('type', 'Student')->each(function ($student) {
            Placement::factory()->count(rand(0, 2))->create([
                'user_id' => $student->id,
            ]);
        });
    }
}
