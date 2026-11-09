<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cohort extends Model
{
    use HasFactory;

    #[Fillable([
        'name',
        'start_date',
        'end_date',
        'capacity',
        'status',
        'track_finsoft',
        'track_finops',
        'created_by',
    ])]
    public function enrolments(): HasMany
    {
        return $this->hasMany(Enrolment::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }

    public function squads(): HasMany
    {
        return $this->hasMany(Squad::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
