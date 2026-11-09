<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerCourseProgress extends Model
{
    #[Fillable([
        'partner_course_enrolment_id',
        'lesson_id',
        'is_completed',
    ])]

    public function enrolment(): BelongsTo
    {
        return $this->belongsTo(PartnerCourseEnrolment::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(PartnerCourseLesson::class);
    }
}
