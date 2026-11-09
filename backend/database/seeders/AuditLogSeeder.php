<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        User::all()->each(function ($user) {
            AuditLog::factory()->count(rand(5, 20))->create([
                'user_id' => $user->id,
            ]);
        });
    }
}
