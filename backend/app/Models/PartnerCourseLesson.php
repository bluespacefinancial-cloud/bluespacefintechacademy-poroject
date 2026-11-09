<?php

namespace App\Models;

use Database\Factories\PartnerCourseLessonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'course_id',
    'title',
    'description',
    'video_url',
    'order_index',
    'is_published',
])]

class PartnerCourseLesson extends Model
{
    use HasFactory;

    public function course(): BelongsTo
    {
        return $this->belongsTo(PartnerCourse::class);
    }

    public static function factory(): Factory
    {
        return PartnerCourseLessonFactory::new();
    }
}
