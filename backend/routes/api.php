<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DataProxyController;
use App\Http\Controllers\FunctionsController;
use App\Http\Controllers\RpcController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
|
| The React client talks only to this application. Authentication issues an
| opaque bearer token; every data request is forwarded to PostgREST with a
| short-lived signed JWT so PostgreSQL row-level security still decides what
| the caller may read or write. The client never receives a PostgREST token.
|
*/

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::post('apply', [AuthController::class, 'apply'])->middleware('throttle:20,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:10,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
    Route::post('resend', [AuthController::class, 'resendVerification'])->middleware('throttle:10,1');

    Route::middleware('auth.token')->group(function () {
        Route::get('session', [AuthController::class, 'session']);
        Route::get('user', [AuthController::class, 'me']);
        Route::get('profile', [AuthController::class, 'profileForRequest']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('update-user', [AuthController::class, 'updateUser']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

// Compatibility shim for the former `auth-handler` edge function. `/apply` is
// public (it creates a pending application); `signup` and `profile` look up
// the bearer token themselves so the route itself stays public.
Route::post('functions/auth-handler', [FunctionsController::class, 'authHandler'])
    ->middleware('throttle:20,1');

Route::middleware('auth.token')->group(function () {
    Route::post('functions/email', [FunctionsController::class, 'email']);

    Route::post('rpc/{function}', RpcController::class)
        ->where('function', '[A-Za-z0-9_]+');

    // Table access, mirroring the PostgREST surface (`/data/users?select=...`).
    Route::match(['get', 'post', 'patch', 'put', 'delete'], 'data/{path?}', DataProxyController::class)
        ->where('path', '.*');
});

Route::get('health', fn () => response()->json([
    'status' => 'ok',
    'timestamp' => now()->toIso8601String(),
]));
