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
        Schema::create('lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('module_id')->constrained('modules');
            $table->string('title', 200);
            $table->string('type', 20)->check("type IN ('concept', 'demonstration', 'video', 'audio', 'lab', 'assessment', 'clinic', 'standup', 'sprint_review', 'retrospective')");
            $table->integer('duration_minutes')->default(60);
            $table->string('content_url', 500)->nullable();
            $table->string('video_url', 500)->nullable();
            $table->string('audio_url', 500)->nullable();
            $table->string('thumbnail_url', 500)->nullable();
            $table->string('caption_url', 500)->nullable();
            $table->boolean('is_required')->default(true);
            $table->integer('order_index')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
