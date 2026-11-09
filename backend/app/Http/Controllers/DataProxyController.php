<?php

namespace App\Http\Controllers;

use App\Support\Jwt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DataProxyController extends Controller
{
    public function __invoke(Request $request, ?string $path = '')
    {
        $path = trim((string) $path, '/');

        if ($path !== '' && ! preg_match('#^[A-Za-z0-9_\-]+(?:/[A-Za-z0-9_\-]+)*$#', $path)) {
            return response()->json(['message' => 'Invalid data path.'], 400);
        }

        return $this->forward($request, $path);
    }

    /**
     * Forward a request to PostgREST with a short-lived JWT that carries the
     * caller's auth UUID and email. That is what makes RLS apply: the token is
     * never trusted from the client, and the role claim is fixed here.
     */
    protected function forward(Request $request, string $path)
    {
        $user = $request->attributes->get('auth_user');

        $jwt = Jwt::sign([
            'role' => 'authenticated',
            'sub' => $user->auth_user_id,
            'email' => $user->email,
            'iat' => time(),
            'exp' => time() + 300,
        ]);

        $base = rtrim((string) config('services.postgrest.url'), '/');
        $url = $base.'/'.$path;

        if ($query = $request->getQueryString()) {
            $url .= '?'.$query;
        }

        $headers = [
            'Authorization' => 'Bearer '.$jwt,
            'Accept' => $request->header('Accept', 'application/json'),
        ];

        foreach (['Content-Type', 'Prefer', 'Range', 'Range-Unit'] as $name) {
            if ($value = $request->header($name)) {
                $headers[$name] = $value;
            }
        }

        $method = strtoupper($request->method());
        $content = $request->getContent();
        $pending = Http::withHeaders($headers)->timeout(30);

        if ($content !== '' && in_array($method, ['POST', 'PATCH', 'PUT'], true)) {
            $pending = $pending->withBody($content, $request->header('Content-Type', 'application/json'));
        }

        $response = $pending->send($method, $url);

        $outHeaders = [];
        foreach (['Content-Type', 'Content-Range', 'Preference-Applied', 'Location'] as $name) {
            if ($response->hasHeader($name)) {
                $outHeaders[$name] = $response->header($name);
            }
        }

        return response($response->body(), $response->status(), $outHeaders);
    }
}
