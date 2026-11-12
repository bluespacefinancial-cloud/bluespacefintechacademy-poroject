/**
 * Client for the BlueSPACE Supabase backend.
 *
 * The React app talks directly to Supabase (PostgREST-compatible API + GoTrue
 * auth). Laravel is kept in `backend/` but is no longer called by the client.
 *
 * This module exposes the same `api` interface the rest of the app already
 * uses (`from`, `select`, `eq`, `insert`, `update`, `upsert`, `delete`,
 * `rpc`, `uploadMedia`, `auth.*`), so page code does not change.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env',
  )
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'bluespace-supabase-auth',
    autoRefreshToken: true,
    persistSession: true,
  },
})

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = null, hint = null } = {}) {
    super(message || 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.hint = hint
  }
}

const authListeners = new Set()

function storeSession(session) {
  if (!session?.access_token || !session?.user) return
  localStorage.setItem('bluespace-token', session.access_token)
  localStorage.setItem('bluespace-user', JSON.stringify(session.user))
}

function clearSession() {
  localStorage.removeItem('bluespace-token')
  localStorage.removeItem('bluespace-user')
}

function emit(event, session) {
  for (const listener of authListeners) {
    try {
      listener(event, session)
    } catch (error) {
      console.error('Auth listener failed:', error)
    }
  }
}

/**
 * Wrap a Supabase PostgrestFilterBuilder so it matches the legacy QueryBuilder
 * interface used by the app: chainable methods, then() for await, and an
 * explicit execute() that returns { data, error, count, status }.
 */
class SupabaseQuery {
  constructor(builder) {
    this.builder = builder
    this._executed = false
  }

  select(columns, options = {}) {
    this.builder = this.builder.select(columns, options)
    return this
  }

  insert(values) {
    this.builder = this.builder.insert(values)
    return this
  }

  update(values) {
    this.builder = this.builder.update(values)
    return this
  }

  upsert(values, options = {}) {
    this.builder = this.builder.upsert(values, options)
    return this
  }

  delete() {
    this.builder = this.builder.delete()
    return this
  }

  eq(column, value) {
    this.builder = this.builder.eq(column, value)
    return this
  }

  in(column, values) {
    this.builder = this.builder.in(column, values)
    return this
  }

  is(column, value) {
    this.builder = this.builder.is(column, value)
    return this
  }

  not(column, operator, value) {
    this.builder = this.builder.not(column, operator, value)
    return this
  }

  gte(column, value) {
    this.builder = this.builder.gte(column, value)
    return this
  }

  lte(column, value) {
    this.builder = this.builder.lte(column, value)
    return this
  }

  ilike(column, pattern) {
    this.builder = this.builder.ilike(column, pattern)
    return this
  }

  or(conditions) {
    this.builder = this.builder.or(conditions)
    return this
  }

  order(column, opts = {}) {
    this.builder = this.builder.order(column, opts)
    return this
  }

  limit(count) {
    this.builder = this.builder.limit(count)
    return this
  }

  range(from, to) {
    this.builder = this.builder.range(from, to)
    return this
  }

  single() {
    this.builder = this.builder.single()
    return this
  }

  maybeSingle() {
    this.builder = this.builder.maybeSingle()
    return this
  }

  async execute() {
    if (this._executed) {
      return this.builder
    }
    this._executed = true
    const { data, error, count, status } = await this.builder
    return {
      data,
      error: error ? new ApiError(error.message, { status, code: error.code }) : null,
      count,
      status,
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }
}

function from(table) {
  return new SupabaseQuery(supabase.from(table))
}

async function rpc(functionName, parameters = {}) {
  const { data, error, status } = await supabase.rpc(functionName, parameters)
  return {
    data,
    error: error ? new ApiError(error.message, { status }) : null,
    status,
  }
}

// ----- Auth ---------------------------------------------------------------

async function signInWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { data: { user: null, session: null }, error: new ApiError(error.message, { status: error.status ?? 400 }) }
  }
  if (data.session) {
    storeSession(data.session)
    emit('SIGNED_IN', data.session)
  }
  return { data: { user: data.user, session: data.session }, error: null }
}

async function signOut() {
  const token = localStorage.getItem('bluespace-token')
  clearSession()
  if (token) {
    try {
      await supabase.auth.signOut()
    } catch {
      // Local session is already gone; a failed logout must not block the UI.
    }
  }
  emit('SIGNED_OUT', null)
  return { error: null }
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    clearSession()
    return { data: { session: null }, error: new ApiError(error.message, { status: error.status ?? 400 }) }
  }
  if (data.session) {
    storeSession(data.session)
  }
  return { data: { session: data.session ?? null }, error: null }
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    clearSession()
    return { data: { user: null }, error: new ApiError(error.message, { status: error.status ?? 400 }) }
  }
  if (data.user) {
    localStorage.setItem('bluespace-user', JSON.stringify(data.user))
  }
  return { data: { user: data.user ?? null }, error: null }
}

async function updateUser(attributes = {}) {
  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) {
    return { data: { user: null }, error: new ApiError(error.message, { status: error.status ?? 400 }) }
  }
  if (data.user) {
    localStorage.setItem('bluespace-user', JSON.stringify(data.user))
    emit('USER_UPDATED', { user: data.user })
  }
  return { data: { user: data.user, profile: data.user }, error: null }
}

async function resetPasswordForEmail(email, { redirectTo } = {}) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return error
    ? { data: null, error: new ApiError(error.message, { status: error.status ?? 400 }) }
    : { data: null, error: null }
}

async function resend({ email } = {}) {
  const { error } = await supabase.auth.resend({ email, type: 'signup' })
  return error
    ? { data: null, error: new ApiError(error.message, { status: error.status ?? 400 }) }
    : { data: null, error: null }
}

function onAuthStateChange(callback) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      storeSession(session)
      emit('SIGNED_IN', session)
    } else if (event === 'SIGNED_OUT') {
      clearSession()
      emit('SIGNED_OUT', null)
    } else if (event === 'TOKEN_REFRESHED' && session) {
      storeSession(session)
      emit('TOKEN_REFRESHED', session)
    } else if (event === 'PASSWORD_RECOVERY') {
      emit('PASSWORD_RECOVERY', session ?? null)
    }
    callback(event, session)
  })

  return {
    data: {
      subscription: {
        unsubscribe: () => subscription.unsubscribe(),
      },
    },
  }
}

// ----- Media upload -------------------------------------------------------

/**
 * Upload one course asset to Supabase Storage.
 *
 * Uses the `media` bucket. The backend validates type/size server-side via
 * Edge Functions or storage policies; the client sends multipart bytes and
 * receives the public URL to store on a course or lesson row.
 */
async function uploadMedia(file, kind) {
  if (!file) {
    return { data: null, error: new ApiError('Choose a file to upload.') }
  }

  const bucket = 'media'
  const fileName = `${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  try {
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      return { data: null, error: new ApiError(error.message, { status: error.status ?? 400 }) }
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      data: {
        id: data.path,
        kind,
        url: urlData.publicUrl,
        mime: file.type,
        bytes: file.size,
        original_name: file.name,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: new ApiError(error.message || 'The upload could not reach the academy service. Check your connection and try again.'),
    }
  }
}

async function invoke(functionName, { body } = {}) {
  return rpc(functionName, body)
}

export const api = {
  from,
  rpc,
  uploadMedia,
  auth: {
    signInWithPassword,
    signOut,
    getSession,
    getUser,
    updateUser,
    resetPasswordForEmail,
    resend,
    onAuthStateChange,
  },
  functions: {
    invoke,
  },
}

export const API_URL = SUPABASE_URL
export default api
