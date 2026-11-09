<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'password',
    'type',
    'avatar',
    'phone',
    'is_active',
    'force_password_change',
    'last_login_at',
    'partner_id',
    'student_id',
])]
#[Hidden([
    'password',
    'remember_token',
    'force_password_change',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'force_password_change' => 'boolean',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the enrolments for this user.
     */
    public function enrolments(): HasMany
    {
        return $this->hasMany(Enrolment::class);
    }

    /**
     * Get the squads this user leads.
     */
    public function squads(): HasMany
    {
        return $this->hasMany(Squad::class, 'squad_lead_id');
    }

    /**
     * Get the partner this user belongs to.
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    /**
     * Get the submissions created by this user.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    /**
     * Get the lessons created by this user.
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'created_by');
    }

    /**
     * Get the clinics where this user is the mentor.
     */
    public function clinics(): HasMany
    {
        return $this->hasMany(Clinic::class, 'mentor_id');
    }

    /**
     * Get the partner courses created by this user.
     */
    public function partnerCourses(): HasMany
    {
        return $this->hasMany(PartnerCourse::class, 'partner_id');
    }

    /**
     * Determine if the user is an administrator.
     */
    public function isAdministrator(): bool
    {
        return $this->type === 'Administrator';
    }

    /**
     * Determine if the user is an instructor.
     */
    public function isInstructor(): bool
    {
        return $this->type === 'Instructor';
    }

    /**
     * Determine if the user is a student.
     */
    public function isStudent(): bool
    {
        return $this->type === 'Student';
    }

    /**
     * Determine if the user is a partner.
     */
    public function isPartner(): bool
    {
        return $this->type === 'Partner';
    }
}
