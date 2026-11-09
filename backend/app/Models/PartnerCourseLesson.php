<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerCourseLesson extends Model
{
    #[Fillable([
        'course_id',
        'title',
        'description',
        'video_url',
        'order_index',
        'is_published',
    ])]

    public function course(): BelongsTo
    {
        return $this->belongsTo(PartnerCourse::class);
    }
}
