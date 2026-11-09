<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LabsController;
use App\Http\Controllers\SubmissionsController;
use App\Http\Controllers\PlacementsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\CertificationsController;

Route::middleware('api')->group(function () {
    // Authentication routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/profile', [AuthController::class, 'profile'])->middleware('auth:sanctum');
    Route::post('/auth/password-change', [AuthController::class, 'changePassword'])->middleware('auth:sanctum');
    Route::post('/auth/activate-account', [AuthController::class, 'deactivate'])->middleware('auth:sanctum');

    // Labs routes
    Route::apiResource('labs', LabsController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Submissions routes
    Route::apiResource('submissions', SubmissionsController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Placements routes
    Route::apiResource('placements', PlacementsController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Reports routes
    Route::get('/reports', [ReportsController::class, 'index']);

    // Certifications routes
    Route::apiResource('certifications', CertificationsController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Health check
    Route::get('/health', function () {
        return response()->json(['status' => 'ok', 'timestamp' => now()]);
    });
});
