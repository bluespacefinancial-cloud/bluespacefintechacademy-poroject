<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('partner_course_progress', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('partner_course_enrolment_id')->constrained('partner_course_enrolments');
            $table->foreignId('lesson_id')->constrained('partner_course_lessons');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_course_progress');
    }
};
