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
        Schema::create('modules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('cohort_id')->constrained('cohorts');
            $table->string('title', 200);
            $table->string('stage', 20)->check("stage IN ('foundations', 'domain_immersion', 'live_projects', 'certification')");
            $table->string('domain', 20)->nullable()->check("domain IN ('FaaS', 'FinCore', 'FinOps', 'FinInfra')");
            $table->string('track', 20)->nullable()->check("track IN ('Finsoft', 'Finops', 'All')");
            $table->text('description')->nullable();
            $table->integer('week_start');
            $table->integer('week_end');
            $table->boolean('is_published')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
