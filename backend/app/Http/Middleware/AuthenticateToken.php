<?php

namespace App\Http\Middleware;

use App\Support\AuthStore;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $session = AuthStore::findSession($token);

        if (! $session) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->attributes->set('auth_user', $session['user']);
        $request->attributes->set('auth_token_hash', $session['token_hash']);

        return $next($request);
    }
}
