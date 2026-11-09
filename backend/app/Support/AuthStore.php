<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Narrow database accessors for the academy database.
 *
 * The Laravel connection authenticates as `lms_service`, which owns nothing and
 * inherits no table privileges. Auth work explicitly switches to `service_role`
 * for the duration of one call, then resets. Data reads and writes never go
 * through this class: they are proxied to PostgREST with the caller's claims so
 * PostgreSQL row-level security stays in charge.
 */
final class AuthStore
{
    public static function service(callable $callback): mixed
    {
        DB::statement('SET ROLE service_role');

        try {
            return $callback();
        } finally {
            DB::statement('RESET ROLE');
        }
    }

    public static function findUserByEmail(string $email): ?object
    {
        $email = strtolower(trim($email));

        return self::service(fn () => DB::table('users')
            ->whereRaw('lower(email) = ?', [$email])
            ->first());
    }

    public static function findUserById(int $id): ?object
    {
        return self::service(fn () => DB::table('users')->where('id', $id)->first());
    }

    public static function findUserByAuthId(string $authId): ?object
    {
        return self::service(fn () => DB::table('users')->where('auth_user_id', $authId)->first());
    }

    /**
     * @return array{token: string, expires_at: Carbon}
     */
    public static function createToken(object $user): array
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = now()->addMinutes((int) config('services.lms.token_ttl_minutes', 10080));

        self::service(fn () => DB::table('auth_tokens')->insert([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'created_at' => now(),
            'expires_at' => $expiresAt,
        ]));

        return ['token' => $token, 'expires_at' => $expiresAt];
    }

    /**
     * Resolve an opaque bearer token to an active profile. Returns null for
     * missing, expired, or deactivated accounts so the caller fails closed.
     */
    public static function findSession(string $token): ?array
    {
        if (strlen($token) < 32) {
            return null;
        }

        $tokenHash = hash('sha256', $token);

        return self::service(function () use ($tokenHash) {
            $row = DB::table('auth_tokens')->where('token_hash', $tokenHash)->first();

            if (! $row || strtotime((string) $row->expires_at) <= time()) {
                return null;
            }

            $user = DB::table('users')->where('id', $row->user_id)->first();

            if (! $user || (int) $user->is_active !== 1) {
                return null;
            }

            // Never let a token outlive the account's active state.
            if (empty($user->auth_user_id)) {
                return null;
            }

            DB::table('auth_tokens')->where('id', $row->id)->update(['last_used_at' => now()]);

            return ['user' => $user, 'token_hash' => $tokenHash];
        });
    }

    public static function deleteToken(string $tokenHash): void
    {
        self::service(fn () => DB::table('auth_tokens')->where('token_hash', $tokenHash)->delete());
    }

    public static function deleteAllTokensFor(int $userId): void
    {
        self::service(fn () => DB::table('auth_tokens')->where('user_id', $userId)->delete());
    }

    /**
     * Shape the auth user the client expects: the auth UUID is the id, and the
     * academy role rides along in user_metadata. The full profile is still
     * loaded separately from public.users.
     */
    public static function authUser(object $user): array
    {
        return [
            'id' => $user->auth_user_id,
            'email' => $user->email,
            'aud' => 'authenticated',
            'role' => 'authenticated',
            'user_metadata' => [
                'type' => $user->type,
                'name' => $user->name,
            ],
            'app_metadata' => [
                'provider' => 'email',
                'providers' => ['email'],
            ],
        ];
    }

    public static function sessionPayload(object $user, string $token): array
    {
        $authUser = self::authUser($user);

        return [
            'user' => $authUser,
            'session' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => (int) config('services.lms.token_ttl_minutes', 10080) * 60,
                'user' => $authUser,
            ],
        ];
    }
}
