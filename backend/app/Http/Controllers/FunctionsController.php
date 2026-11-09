<?php

namespace App\Http\Controllers;

use App\Support\AuthStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class FunctionsController extends Controller
{
    /**
     * Replacement for the former email-service edge function.
     */
    public function email(Request $request)
    {
        $actor = $request->attributes->get('auth_user');

        if (! $actor || (int) $actor->is_active !== 1) {
            return response()->json(['message' => 'Active academy account required.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'to' => ['required', 'string', 'email', 'max:191'],
            'subject' => ['required', 'string', 'max:200'],
            'html' => ['required', 'string', 'max:100000'],
            'text' => ['nullable', 'string', 'max:20000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $to = strtolower((string) $request->input('to'));

        if ($actor->type !== 'Administrator' && $to !== strtolower((string) $actor->email)) {
            return response()->json(['message' => 'Only administrators can send email to other recipients.'], 403);
        }

        $subject = trim((string) $request->input('subject'));
        $html = (string) $request->input('html');
        $text = $request->input('text');

        try {
            Mail::send([], [], function ($message) use ($to, $subject, $html, $text) {
                $message->to($to)->subject($subject)->html($html);

                if (is_string($text) && $text !== '') {
                    $message->text($text);
                }
            });
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'Email delivery failed.'], 502);
        }

        return response()->json(['sent' => true], 202);
    }

    /**
     * Compatibility shim for the old auth-handler function invocation.
     */
    public function authHandler(Request $request, AuthController $auth)
    {
        $action = (string) $request->input('action', '');

        if ($action === 'apply' || $action === '') {
            return $auth->apply($request);
        }

        if ($action === 'signup') {
            $token = $request->bearerToken();
            $session = $token ? AuthStore::findSession($token) : null;

            if (! $session) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $request->attributes->set('auth_user', $session['user']);

            return $auth->adminSignup($request);
        }

        if ($action === 'profile') {
            $token = $request->bearerToken();
            $session = $token ? AuthStore::findSession($token) : null;

            if (! $session) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $request->attributes->set('auth_user', $session['user']);

            return $auth->profileForRequest($request);
        }

        return response()->json(['message' => 'Not found.'], 404);
    }
}
