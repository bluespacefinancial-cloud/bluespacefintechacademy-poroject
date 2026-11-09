<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sprint extends Model
{
    #[Fillable([
        'module_id',
        'title',
        'starts_at',
        'ends_at',
    ])]

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
