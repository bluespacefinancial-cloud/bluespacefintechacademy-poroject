<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title', 200);
            $table->foreignId('cohort_id')->nullable()->constrained('cohorts');
            $table->foreignId('mentor_id')->nullable()->constrained('users');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('meet_url', 500)->nullable();
            $table->integer('capacity')->default(15);
            $table->string('status', 20)->default('scheduled');
            $table->integer('attendee_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinics');
    }
};
