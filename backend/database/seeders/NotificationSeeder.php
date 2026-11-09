<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        User::all()->each(function ($user) {
            Notification::factory()->count(rand(1, 5))->create([
                'user_id' => $user->id,
            ]);
        });
    }
}
