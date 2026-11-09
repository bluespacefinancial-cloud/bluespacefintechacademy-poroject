<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Placement extends Model
{
    #[Fillable([
        'user_id',
        'certification_id',
        'company',
        'role',
        'location',
        'starts_at',
        'ends_at',
        'status',
    ])]

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }
}
