<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Range'],

    'max_age' => 0,

    // Bearer tokens travel on cross-origin fetch calls (Vercel frontend ->
    // PHP API host). Credentials must be enabled so the Authorization header
    // is sent. With credentials on, allowed_origins must be a list of
    // specific origins, never '*'. Set CORS_ALLOWED_ORIGINS to the
    // production frontend origin before deploying.
    'supports_credentials' => true,

];
