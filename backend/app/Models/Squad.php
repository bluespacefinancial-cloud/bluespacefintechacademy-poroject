<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Squad extends Model
{
    #[Fillable([
        'cohort_id',
        'name',
        'squad_lead_id',
    ])]

    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    public function squadLead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'squad_lead_id');
    }

    public function enrolments(): HasMany
    {
        return $this->hasMany(Enrolment::class);
    }
}
