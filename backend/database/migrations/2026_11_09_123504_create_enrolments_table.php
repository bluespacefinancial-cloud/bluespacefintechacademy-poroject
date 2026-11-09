<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrolments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('cohort_id')->constrained('cohorts');
            $table->foreignId('user_id')->constrained('users');
            $table->string('track', 20);
            $table->string('status', 20);
            $table->foreignId('squad_id')->nullable()->constrained('squads');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrolments');
    }
};
