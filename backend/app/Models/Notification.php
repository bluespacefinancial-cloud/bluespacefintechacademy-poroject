<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    #[Fillable([
        'user_id',
        'title',
        'content',
        'type',
        'is_read',
    ])]

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
