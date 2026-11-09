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
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->string('password')->default(null); // Bcrypt hash used by the academy API
            $table->string('type')->default('Student')->check("type IN ('Student', 'Instructor', 'Partner', 'Administrator')");
            $table->string('avatar')->default('avatar.png');
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->smallInteger('force_password_change')->default(0);
            $table->timestamp('last_login_at')->nullable();
            $table->foreignId('partner_id')->nullable()->constrained('users');
            $table->string('student_id', 50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
