<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Emits security headers on every API response.
 *
 * Content-Security-Policy locks the frontend down to same-origin scripts,
 * inline styles only from the app bundle, and no frames. The client is a
 * Vite-built SPA served from a single origin, so there is no reason to
 * trust third-party script sources.
 *
 * X-Content-Type-Options and X-Frame-Options block MIME-sniffing and
 * clickjacking. Strict-Transport-Security is emitted only when the request
 * arrived over HTTPS so local development over plain HTTP is not broken.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $csp = "default-src 'self'; "
            ."script-src 'self'; "
            ."style-src 'self' 'unsafe-inline'; "
            ."img-src 'self' data: https:; "
            ."font-src 'self'; "
            ."connect-src 'self' ".rtrim((string) config('services.postgrest.url'), '/').'; '
            ."frame-ancestors 'none'; "
            ."base-uri 'self'; "
            ."form-action 'self';";

        $response->headers->set('Content-Security-Policy', $csp);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
