<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'partner_course_id',
    'user_id',
])]

class PartnerCourseEnrolment extends Model
{
    use HasFactory;

    public function course(): BelongsTo
    {
        return $this->belongsTo(PartnerCourse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
