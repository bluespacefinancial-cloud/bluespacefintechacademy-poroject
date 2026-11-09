<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Academy application
    |--------------------------------------------------------------------------
    |
    | PostgREST is the data API behind this application. Laravel authenticates
    | the client, signs a short-lived token for PostgREST, and proxies requests
    | so PostgreSQL row-level security remains the authority on every query.
    |
    */

    'postgrest' => [
        'url' => env('POSTGREST_URL', 'http://127.0.0.1:54330'),
        'jwt_secret' => env('PGRST_JWT_SECRET'),
    ],

    'lms' => [
        'frontend_url' => env('LMS_FRONTEND_URL', 'http://localhost:3000'),
        'token_ttl_minutes' => (int) env('LMS_TOKEN_TTL_MINUTES', 10080),
        'recovery_ttl_minutes' => (int) env('LMS_RECOVERY_TTL_MINUTES', 60),
    ],

];
