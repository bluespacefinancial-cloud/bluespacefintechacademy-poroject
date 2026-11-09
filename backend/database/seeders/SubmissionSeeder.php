<?php

namespace Database\Seeders;

use App\Models\Lab;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;

class SubmissionSeeder extends Seeder
{
    public function run(): void
    {
        Lab::all()->each(function ($lab) {
            User::where('type', 'Student')
                ->inRandomOrder()
                ->limit(rand(1, 5))
                ->each(function ($student) use ($lab) {
                    Submission::factory()->create([
                        'lab_id' => $lab->id,
                        'user_id' => $student->id,
                    ]);
                });
        });
    }
}
