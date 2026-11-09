<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certification extends Model
{
    #[Fillable([
        'user_id',
        'title',
        'type',
        'issued_at',
        'certificate_url',
    ])]

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
