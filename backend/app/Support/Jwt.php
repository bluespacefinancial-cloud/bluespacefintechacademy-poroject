<?php

namespace App\Support;

use RuntimeException;

/**
 * Minimal HS256 JWT minting for internal service-to-service calls.
 *
 * The React client never sees these tokens. Laravel signs a short-lived token
 * for PostgREST after it has authenticated the caller's opaque bearer token.
 * PostgREST verifies the signature and turns the claims into the PostgreSQL
 * session (`request.jwt.claims`) used by auth.uid()/auth.email() and RLS.
 */
final class Jwt
{
    public static function sign(array $claims): string
    {
        $secret = (string) config('services.postgrest.jwt_secret');

        if (strlen($secret) < 32) {
            throw new RuntimeException('PGRST_JWT_SECRET is missing or too short.');
        }

        $header = self::encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = self::encode($claims);
        $signature = self::encode(hash_hmac('sha256', $header.'.'.$payload, $secret, true));

        return $header.'.'.$payload.'.'.$signature;
    }

    private static function encode(string|array $value): string
    {
        $json = is_array($value)
            ? json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            : $value;

        return rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
    }
}
