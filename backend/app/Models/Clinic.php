<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Clinic extends Model
{
    #[Fillable([
        'title',
        'cohort_id',
        'mentor_id',
        'starts_at',
        'ends_at',
        'meet_url',
        'capacity',
        'status',
        'attendee_count',
        'created_by',
    ])]

    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
