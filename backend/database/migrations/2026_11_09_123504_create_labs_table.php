<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('lesson_id')->constrained('lessons');
            $table->string('title');
            $table->text('instructions');
            $table->text('starter_code');
            $table->string('content_url')->nullable();
            $table->integer('max_score');
            $table->date('due_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labs');
    }
};
