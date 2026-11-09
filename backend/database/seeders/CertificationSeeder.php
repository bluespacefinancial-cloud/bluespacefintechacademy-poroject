<?php

namespace Database\Seeders;

use App\Models\Certification;
use App\Models\User;
use Illuminate\Database\Seeder;

class CertificationSeeder extends Seeder
{
    public function run(): void
    {
        User::where('type', 'Student')->each(function ($student) {
            Certification::factory()->count(rand(0, 3))->create([
                'user_id' => $student->id,
            ]);
        });
    }
}
