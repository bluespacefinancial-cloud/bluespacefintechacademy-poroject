<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerCourse extends Model
{
    use HasFactory;

    #[Fillable([
        'partner_id',
        'title',
        'description',
        'domain',
        'status',
        'is_published',
    ])]

    public function partner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'partner_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(PartnerCourseLesson::class);
    }

    public function enrolments(): HasMany
    {
        return $this->hasMany(PartnerCourseEnrolment::class);
    }
}
