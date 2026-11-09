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
        Schema::create('partner_courses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('partner_id')->constrained('users');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('domain', 20)->nullable()->check("domain IN ('FaaS', 'FinCore', 'FinOps', 'FinInfra')");
            $table->string('status', 20)->default('pending')->check("status IN ('pending', 'approved', 'suspended')");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_courses');
    }
};
