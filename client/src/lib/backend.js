/**
 * Client transport layer — now backed by Supabase.
 *
 * This file is kept as the canonical import path (`../lib/backend`) so that no
 * page or context file needs to change. It re-exports everything from
 * `./supabase.js`, which talks directly to Supabase (PostgREST-compatible API
 * + GoTrue auth). The Laravel backend remains in `backend/` but is no longer
 * called by the client.
 */

export { api, API_URL, ApiError } from './supabase.js'
export { default } from './supabase.js'
