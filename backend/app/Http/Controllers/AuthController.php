<?php

namespace App\Http\Controllers;

use App\Support\AuthStore;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private const ROLES = ['Student', 'Instructor', 'Partner', 'Administrator'];

    private const APPLICANT_ROLES = ['Student', 'Instructor', 'Partner'];

    private const DOMAINS = ['FaaS', 'FinCore', 'FinOps', 'FinInfra'];

    private const PARTNERSHIP_FOCUS = [
        'Learning content',
        'Project briefs',
        'Mentorship',
        'Internships and hiring',
        'Other',
    ];

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email', 'max:191'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Enter a valid email and password.'], 422);
        }

        $user = AuthStore::findUserByEmail((string) $request->input('email'));

        // Constant-time-ish failure path: always return the same response for a
        // missing account and a wrong password, and never fall back to a weaker
        // authentication path when the password column is empty.
        if (! $user || ! is_string($user->password) || $user->password === '') {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (! password_verify((string) $request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ((int) $user->is_active !== 1) {
            return response()->json(['message' => 'This account is not active in the academy.'], 403);
        }

        AuthStore::service(fn () => DB::table('users')->where('id', $user->id)->update([
            'last_login_at' => now(),
            'updated_at' => now(),
        ]));

        $token = AuthStore::createToken($user);

        return response()->json(AuthStore::sessionPayload($user, $token['token']));
    }

    public function session(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $token = (string) $request->bearerToken();

        return response()->json(AuthStore::sessionPayload($user, $token));
    }

    public function me(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'user' => AuthStore::authUser($user),
            'profile' => $this->profile($user),
        ]);
    }

    public function profileForRequest(Request $request)
    {
        return response()->json($this->profile($request->attributes->get('auth_user')));
    }

    public function logout(Request $request)
    {
        $hash = $request->attributes->get('auth_token_hash');

        if ($hash) {
            AuthStore::deleteToken($hash);
        }

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * Client-compatible user update: password, email, or profile metadata.
     */
    public function updateUser(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        $data = $request->input('data', []);
        if (! is_array($data)) {
            $data = [];
        }

        $updates = [];

        if ($request->filled('password')) {
            $password = (string) $request->input('password');

            if (strlen($password) < 8) {
                return response()->json(['message' => 'Use a password with at least 8 characters.'], 422);
            }

            $updates['password'] = password_hash($password, PASSWORD_BCRYPT);
            $updates['force_password_change'] = 0;
        }

        if ($request->filled('email')) {
            $email = strtolower(trim((string) $request->input('email')));

            if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
                return response()->json(['message' => 'Enter a valid email address.'], 422);
            }

            $exists = AuthStore::service(fn () => DB::table('users')
                ->whereRaw('lower(email) = ?', [$email])
                ->where('id', '!=', $user->id)
                ->exists());

            if ($exists) {
                return response()->json(['message' => 'That email address is already in use.'], 409);
            }

            $updates['email'] = $email;
        }

        foreach (['name', 'phone', 'avatar'] as $field) {
            if (array_key_exists($field, $data) || $request->has($field)) {
                $value = array_key_exists($field, $data) ? $data[$field] : $request->input($field);
                $updates[$field] = $value === null ? null : (string) $value;
            }
        }

        if ($updates !== []) {
            $updates['updated_at'] = now();
            AuthStore::service(fn () => DB::table('users')->where('id', $user->id)->update($updates));
            $user = AuthStore::findUserById((int) $user->id);
        }

        return response()->json([
            'user' => AuthStore::authUser($user),
            'profile' => $this->profile($user),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'different:current_password'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Enter your current password and a new password of at least 8 characters.'], 422);
        }

        $user = $request->attributes->get('auth_user');

        if (! is_string($user->password) || ! password_verify((string) $request->input('current_password'), $user->password)) {
            return response()->json(['message' => 'Your current password is incorrect.'], 401);
        }

        AuthStore::service(fn () => DB::table('users')->where('id', $user->id)->update([
            'password' => password_hash((string) $request->input('new_password'), PASSWORD_BCRYPT),
            'force_password_change' => 0,
            'updated_at' => now(),
        ]));

        return response()->json(['message' => 'Password changed.']);
    }

    /**
     * Public application endpoint. Port of the former auth-handler /apply.
     */
    public function apply(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:191'],
            'email' => ['required', 'string', 'email', 'max:191'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:Student,Instructor,Partner'],
            'phone' => ['nullable', 'string', 'max:191'],
            'track' => ['nullable', 'in:Finsoft,Finops'],
            'organisation' => ['nullable', 'string', 'max:200'],
            'motivation' => ['nullable', 'string', 'max:2000'],
            'website' => ['nullable', 'string', 'max:500'],
            'teachingDomains' => ['nullable', 'array'],
            'teachingDomains.*' => ['in:FaaS,FinCore,FinOps,FinInfra'],
            'teachingExperience' => ['nullable', 'string', 'max:3000'],
            'partnershipFocus' => ['nullable', 'string', 'max:60'],
            'partnershipDetails' => ['nullable', 'string', 'max:3000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $role = (string) $request->input('role');
        $email = strtolower(trim((string) $request->input('email')));
        $name = trim((string) $request->input('name'));

        if ($role === 'Student' && ! in_array($request->input('track'), ['Finsoft', 'Finops'], true)) {
            return response()->json(['message' => 'Students must choose a valid track.'], 422);
        }

        $teachingDomains = array_values(array_unique((array) $request->input('teachingDomains', [])));
        if ($role === 'Instructor' && ($teachingDomains === [] || trim((string) $request->input('teachingExperience')) === '')) {
            return response()->json(['message' => 'Choose teaching domains and describe your relevant experience.'], 422);
        }

        if ($role === 'Partner' && (
            trim((string) $request->input('organisation')) === ''
            || ! in_array($request->input('partnershipFocus'), self::PARTNERSHIP_FOCUS, true)
            || trim((string) $request->input('partnershipDetails')) === ''
        )) {
            return response()->json(['message' => 'Partner applications require an organisation, partnership focus, and details.'], 422);
        }

        if ($request->filled('website')) {
            $scheme = parse_url((string) $request->input('website'), PHP_URL_SCHEME);
            if (! in_array($scheme, ['http', 'https'], true)) {
                return response()->json(['message' => 'Enter a valid website URL.'], 422);
            }
        }

        if (AuthStore::findUserByEmail($email)) {
            return response()->json(['message' => 'An account already exists for this email address.'], 409);
        }

        $domainsLiteral = '{'.implode(',', array_map(
            fn ($domain) => '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $domain).'"',
            $teachingDomains,
        )).'}';

        try {
            $result = AuthStore::service(function () use ($request, $role, $email, $name, $domainsLiteral) {
                return DB::transaction(function () use ($request, $role, $email, $name, $domainsLiteral) {
                    $authUserId = (string) Str::uuid();

                    $userId = DB::table('users')->insertGetId([
                        'auth_user_id' => $authUserId,
                        'name' => $name,
                        'email' => $email,
                        'password' => password_hash((string) $request->input('password'), PASSWORD_BCRYPT),
                        'type' => $role,
                        'phone' => $request->input('phone') ?: null,
                        'is_active' => 0,
                        'force_password_change' => 0,
                    ]);

                    DB::table('academy_applications')->insert([
                        'auth_user_id' => $authUserId,
                        'user_id' => $userId,
                        'name' => $name,
                        'email' => $email,
                        'phone' => $request->input('phone') ?: null,
                        'requested_role' => $role,
                        'track' => $role === 'Student' ? $request->input('track') : null,
                        'organisation' => $role === 'Partner' ? trim((string) $request->input('organisation')) : null,
                        'motivation' => $request->input('motivation') ?: null,
                        'website' => $role === 'Partner' ? ($request->input('website') ?: null) : null,
                        'teaching_domains' => DB::raw("'{$domainsLiteral}'::text[]"),
                        'teaching_experience' => $role === 'Instructor' ? trim((string) $request->input('teachingExperience')) : null,
                        'partnership_focus' => $role === 'Partner' ? $request->input('partnershipFocus') : null,
                        'partnership_details' => $role === 'Partner' ? trim((string) $request->input('partnershipDetails')) : null,
                    ]);

                    return ['user_id' => $userId];
                });
            });
        } catch (QueryException $exception) {
            Log::warning('Application insert failed', ['message' => $exception->getMessage()]);

            return response()->json(['message' => 'Unable to submit your application right now.'], 500);
        }

        return response()->json([
            'submitted' => true,
            'emailConfirmationRequired' => false,
            'user_id' => $result['user_id'],
        ], 201);
    }

    /**
     * Administrator-only account provisioning, ported from auth-handler /signup.
     */
    public function adminSignup(Request $request)
    {
        $actor = $request->attributes->get('auth_user');

        if ($actor->type !== 'Administrator' || (int) $actor->is_active !== 1) {
            return response()->json(['message' => 'Administrator only.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email', 'max:191'],
            'password' => ['required', 'string', 'min:8'],
            'type' => ['required', 'in:Student,Instructor,Partner,Administrator'],
            'name' => ['nullable', 'string', 'max:191'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $email = strtolower(trim((string) $request->input('email')));

        if (AuthStore::findUserByEmail($email)) {
            return response()->json(['message' => 'An account already exists for this email address.'], 409);
        }

        AuthStore::service(fn () => DB::table('users')->insert([
            'auth_user_id' => (string) Str::uuid(),
            'name' => $request->input('name') ?: $email,
            'email' => $email,
            'password' => password_hash((string) $request->input('password'), PASSWORD_BCRYPT),
            'type' => $request->input('type'),
            'is_active' => 1,
            'force_password_change' => 1,
        ]));

        return response()->json(['created' => true], 201);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email', 'max:191'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Enter a valid email address.'], 422);
        }

        $email = strtolower(trim((string) $request->input('email')));
        $user = AuthStore::findUserByEmail($email);

        // Always return the same response so this endpoint cannot enumerate
        // accounts. Only active accounts with a password can reset.
        if ($user && (int) $user->is_active === 1 && is_string($user->password) && $user->password !== '') {
            $token = bin2hex(random_bytes(32));
            $expiresAt = now()->addMinutes((int) config('services.lms.recovery_ttl_minutes', 60));

            AuthStore::service(function () use ($user, $token, $expiresAt) {
                DB::table('password_resets')->where('user_id', $user->id)->whereNull('used_at')->delete();
                DB::table('password_resets')->insert([
                    'user_id' => $user->id,
                    'token_hash' => hash('sha256', $token),
                    'created_at' => now(),
                    'expires_at' => $expiresAt,
                ]);
            });

            $resetUrl = $this->resetUrl($request, $token);

            try {
                Mail::send([], [], function ($message) use ($email, $resetUrl) {
                    $message->to($email)
                        ->subject('Reset your BlueSPACE Fintech Academy password')
                        ->html(
                            '<p>Hello,</p>'
                            .'<p>Use the link below to choose a new password. It expires in '
                            .(int) config('services.lms.recovery_ttl_minutes', 60).' minutes.</p>'
                            .'<p><a href="'.e($resetUrl).'">Reset my password</a></p>'
                            .'<p>If you did not request this, you can ignore this email.</p>'
                        )
                        ->text("Reset your BlueSPACE password: {$resetUrl}");
                });
            } catch (\Throwable $exception) {
                Log::error('Password reset email failed', ['message' => $exception->getMessage()]);
            }

            if (config('app.debug')) {
                return response()->json(['sent' => true, 'reset_url' => $resetUrl]);
            }
        }

        return response()->json(['sent' => true]);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string', 'min:32', 'max:256'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'This password reset link is invalid or has expired.'], 422);
        }

        $tokenHash = hash('sha256', (string) $request->input('token'));

        $reset = AuthStore::service(fn () => DB::table('password_resets')
            ->where('token_hash', $tokenHash)
            ->whereNull('used_at')
            ->first());

        if (! $reset || strtotime((string) $reset->expires_at) <= time()) {
            return response()->json(['message' => 'This password reset link is invalid or has expired.'], 422);
        }

        $user = AuthStore::findUserById((int) $reset->user_id);

        if (! $user || (int) $user->is_active !== 1) {
            return response()->json(['message' => 'This password reset link is invalid or has expired.'], 422);
        }

        AuthStore::service(function () use ($reset, $user, $request) {
            DB::table('users')->where('id', $user->id)->update([
                'password' => password_hash((string) $request->input('password'), PASSWORD_BCRYPT),
                'force_password_change' => 0,
                'updated_at' => now(),
            ]);

            DB::table('password_resets')->where('id', $reset->id)->update(['used_at' => now()]);
            DB::table('auth_tokens')->where('user_id', $user->id)->delete();
        });

        return response()->json(['updated' => true]);
    }

    public function resendVerification(Request $request)
    {
        // Accounts are provisioned by the academy team rather than email
        // confirmation, so this endpoint acknowledges without disclosing status.
        return response()->json(['sent' => true]);
    }

    private function resetUrl(Request $request, string $token): string
    {
        $frontend = rtrim((string) config('services.lms.frontend_url', 'http://localhost:5173'), '/');
        $redirect = (string) $request->input('redirect_to', '');

        if ($redirect === '' || ! $this->isSameOrigin($redirect, $frontend)) {
            $redirect = $frontend.'/reset-password';
        }

        $separator = str_contains($redirect, '#') ? '' : '#';

        return $redirect.$separator.'access_token='.urlencode($token).'&type=recovery';
    }

    private function isSameOrigin(string $url, string $allowed): bool
    {
        $left = parse_url($url);
        $right = parse_url($allowed);

        if (! is_array($left) || ! is_array($right)) {
            return false;
        }

        return ($left['scheme'] ?? '') === ($right['scheme'] ?? '')
            && ($left['host'] ?? '') === ($right['host'] ?? '')
            && ($left['port'] ?? null) === ($right['port'] ?? null);
    }

    private function profile(object $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => $user->type,
            'avatar' => $user->avatar,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'force_password_change' => $user->force_password_change,
            'last_login_at' => $user->last_login_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'student_id' => $user->student_id,
        ];
    }
}
