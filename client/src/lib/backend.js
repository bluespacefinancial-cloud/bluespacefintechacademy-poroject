/**
 * Client for the BlueSPACE Laravel API.
 *
 * The React app no longer talks to a database directly. Laravel authenticates
 * the caller, then forwards data requests to the internal PostgREST service
 * with a short-lived signed token, so PostgreSQL row-level security still
 * decides what every role can read and write.
 *
 * The query builder mirrors the small part of the legacy client API this app
 * used (`from`, `select`, `eq`, `in`, `not`, `is`, `gte`, `order`, `limit`,
 * `single`, `maybeSingle`, `insert`, `update`, `upsert`, `delete`, `rpc`) so
 * page code stays focused on the academy instead of transport details.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const RECOVERY_KEY = 'bluespace-recovery-token'

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

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function storeSession(session) {
  if (!session?.access_token || !session?.user) return
  localStorage.setItem(TOKEN_KEY, session.access_token)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
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
 * Reset links are handled here rather than by a vendor SDK. The backend sends
 * `/reset-password?from=...#access_token=...&type=recovery`; we keep the token
 * in sessionStorage so the form can exchange it for a new password, and strip
 * it from the address bar so it is not copied or bookmarked.
 */
function detectRecoveryToken() {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash.replace(/^#/, '')
  if (hash) {
    const params = new URLSearchParams(hash)
    const token = params.get('access_token')

    if (params.get('type') === 'recovery' && token) {
      sessionStorage.setItem(RECOVERY_KEY, token)
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      return token
    }
  }

  return sessionStorage.getItem(RECOVERY_KEY)
}

const recoveryToken = typeof window === 'undefined' ? null : detectRecoveryToken()

function recoverySession() {
  return {
    access_token: recoveryToken,
    token_type: 'bearer',
    user: { id: null, email: null, user_metadata: {} },
  }
}

async function apiFetch(path, { method = 'GET', body, headers = {}, token } = {}) {
  const authToken = token ?? localStorage.getItem(TOKEN_KEY)
  const requestHeaders = { Accept: 'application/json', ...headers }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('The academy service is unreachable. Check your connection and try again.')
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  return { response, payload }
}

function toError(payload, response) {
  const message = typeof payload === 'string'
    ? payload
    : payload?.message || payload?.error || response.statusText || 'Request failed'

  return new ApiError(message, {
    status: response.status,
    code: payload?.code ?? null,
    details: payload?.details ?? null,
    hint: payload?.hint ?? null,
  })
}

function quoteInValue(value) {
  const text = String(value)
  return /[(),"]/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text
}

class QueryBuilder {
  constructor(table) {
    this.table = table
    this.method = 'GET'
    this.params = new URLSearchParams()
    this.prefer = []
    this.body = undefined
    this.objectMode = null
    this.head = false
    this.countExact = false
    this.emptyResult = false
  }

  select(columns = '*', options = {}) {
    this.params.set('select', columns)

    if (options.count === 'exact') {
      this.countExact = true
    }
    if (options.head) {
      this.head = true
    }
    if (this.method !== 'GET' && !this.head) {
      this.prefer.push('return=representation')
    }

    return this
  }

  insert(values) {
    this.method = 'POST'
    this.body = values
    return this
  }

  update(values) {
    this.method = 'PATCH'
    this.body = values
    return this
  }

  upsert(values, options = {}) {
    this.method = 'POST'
    this.body = values
    this.params.set('on_conflict', options.onConflict || 'id')
    this.prefer.push('resolution=merge-duplicates')
    return this
  }

  delete() {
    this.method = 'DELETE'
    return this
  }

  addFilter(column, operator, value) {
    if (operator === 'in') {
      const values = Array.isArray(value) ? value : []
      if (values.length === 0) {
        this.emptyResult = true
        return this
      }
      this.params.append(column, `in.(${values.map(quoteInValue).join(',')})`)
      return this
    }

    if (operator === 'is') {
      this.params.append(column, `is.${value === null ? 'null' : value}`)
      return this
    }

    this.params.append(column, `${operator}.${value === null ? 'null' : value}`)
    return this
  }

  eq(column, value) {
    return this.addFilter(column, 'eq', value)
  }

  ilike(column, pattern) {
    return this.addFilter(column, 'ilike', pattern)
  }

  in(column, values) {
    return this.addFilter(column, 'in', values)
  }

  is(column, value) {
    return this.addFilter(column, 'is', value)
  }

  not(column, operator, value) {
    return this.addFilter(column, `not.${operator}`, value)
  }

  gte(column, value) {
    return this.addFilter(column, 'gte', value)
  }

  lte(column, value) {
    return this.addFilter(column, 'lte', value)
  }

  order(column, { ascending = true, nullsFirst } = {}) {
    const direction = ascending ? 'asc' : 'desc'
    const nulls = nullsFirst === undefined ? '' : nullsFirst ? '.nullsfirst' : '.nullslast'
    const term = `${column}.${direction}${nulls}`
    const existing = this.params.get('order')

    this.params.set('order', existing ? `${existing},${term}` : term)
    return this
  }

  limit(count) {
    this.params.set('limit', String(count))
    return this
  }

  single() {
    this.objectMode = 'single'
    return this
  }

  maybeSingle() {
    this.objectMode = 'maybe'
    return this
  }

  async execute() {
    if (this.emptyResult) {
      return { data: this.head ? null : [], error: null, count: 0, status: 200 }
    }

    if (this.objectMode && !this.params.has('limit')) {
      this.params.set('limit', '2')
    }

    let path = `/data/${this.table}`
    const query = this.params.toString()
    if (query) {
      path += `?${query}`
    }

    const headers = {}
    if (this.prefer.length || this.countExact) {
      const prefer = [...this.prefer]
      if (this.countExact) {
        prefer.push('count=exact')
      }
      headers.Prefer = prefer.join(',')
    }

    const method = this.head ? 'HEAD' : this.method

    try {
      const { response, payload } = await apiFetch(path, {
        method,
        headers,
        body: this.method === 'GET' || this.method === 'DELETE' ? undefined : this.body,
      })

      const contentRange = response.headers.get('Content-Range')
      const rangeMatch = contentRange ? contentRange.match(/\/(\d+)$/) : null
      const count = rangeMatch ? Number(rangeMatch[1]) : null

      if (!response.ok) {
        return { data: null, error: toError(payload, response), count, status: response.status }
      }

      let data = method === 'HEAD' ? null : payload

      if (this.objectMode && Array.isArray(data)) {
        if (data.length === 1) {
          data = data[0]
        } else if (data.length === 0) {
          data = null
          if (this.objectMode === 'single') {
            return {
              data: null,
              error: new ApiError('No rows found', { status: 406, code: 'PGRST116' }),
              count,
              status: 406,
            }
          }
        } else {
          return {
            data: null,
            error: new ApiError('Multiple rows returned for a single-row query', { status: 406, code: 'PGRST116' }),
            count,
            status: 406,
          }
        }
      }

      return { data, error: null, count, status: response.status }
    } catch (error) {
      return {
        data: null,
        error: error instanceof ApiError ? error : new ApiError(error.message),
        count: null,
        status: 0,
      }
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }
}

async function signInWithPassword({ email, password }) {
  try {
    const { response, payload } = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    if (!response.ok) {
      return { data: { user: null, session: null }, error: toError(payload, response) }
    }

    storeSession(payload.session)
    emit('SIGNED_IN', payload.session)

    return { data: { user: payload.user, session: payload.session }, error: null }
  } catch (error) {
    return { data: { user: null, session: null }, error }
  }
}

async function signOut() {
  const token = localStorage.getItem(TOKEN_KEY)
  clearSession()
  sessionStorage.removeItem(RECOVERY_KEY)

  if (token) {
    try {
      await apiFetch('/auth/logout', { method: 'POST', token })
    } catch {
      // The local session is already gone; a failed logout must not block the UI.
    }
  }

  emit('SIGNED_OUT', null)
  return { error: null }
}

async function getSession() {
  if (recoveryToken && !localStorage.getItem(TOKEN_KEY)) {
    return { data: { session: recoverySession() }, error: null }
  }

  if (!localStorage.getItem(TOKEN_KEY)) {
    return { data: { session: null }, error: null }
  }

  try {
    const { response, payload } = await apiFetch('/auth/session')

    if (!response.ok) {
      if (response.status === 401) {
        clearSession()
      }
      return { data: { session: null }, error: toError(payload, response) }
    }

    storeSession(payload.session)
    return { data: { session: payload.session }, error: null }
  } catch (error) {
    return { data: { session: null }, error }
  }
}

async function getUser() {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token) {
    return { data: { user: readStoredUser() }, error: null }
  }

  try {
    const { response, payload } = await apiFetch('/auth/user')

    if (!response.ok) {
      if (response.status === 401) {
        clearSession()
      }
      return { data: { user: null }, error: toError(payload, response) }
    }

    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    return { data: { user: payload.user }, error: null }
  } catch (error) {
    return { data: { user: null }, error }
  }
}

async function updateUser(attributes = {}) {
  // A recovery link is exchanged for a password, not for a login token. Keep
  // that exchange on the dedicated endpoint so the reset token can never be
  // used to read academy data.
  if (recoveryToken && !localStorage.getItem(TOKEN_KEY)) {
    if (!attributes.password) {
      return {
        data: { user: null },
        error: new ApiError('A new password is required.', { status: 422 }),
      }
    }

    try {
      const { response, payload } = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token: recoveryToken, password: attributes.password },
      })

      if (!response.ok) {
        return { data: { user: null }, error: toError(payload, response) }
      }

      sessionStorage.removeItem(RECOVERY_KEY)
      return { data: { user: null }, error: null }
    } catch (error) {
      return { data: { user: null }, error }
    }
  }

  try {
    const { response, payload } = await apiFetch('/auth/update-user', {
      method: 'POST',
      body: attributes,
    })

    if (!response.ok) {
      return { data: { user: null }, error: toError(payload, response) }
    }

    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    emit('USER_UPDATED', { user: payload.user })

    return { data: { user: payload.user, profile: payload.profile }, error: null }
  } catch (error) {
    return { data: { user: null }, error }
  }
}

async function resetPasswordForEmail(email, { redirectTo } = {}) {
  try {
    const { response, payload } = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email, redirect_to: redirectTo },
    })

    return response.ok
      ? { data: payload, error: null }
      : { data: null, error: toError(payload, response) }
  } catch (error) {
    return { data: null, error }
  }
}

async function resend({ email } = {}) {
  try {
    const { response, payload } = await apiFetch('/auth/resend', {
      method: 'POST',
      body: { email },
    })

    return response.ok
      ? { data: payload, error: null }
      : { data: null, error: toError(payload, response) }
  } catch (error) {
    return { data: null, error }
  }
}

function onAuthStateChange(callback) {
  authListeners.add(callback)

  if (recoveryToken && !localStorage.getItem(TOKEN_KEY)) {
    queueMicrotask(() => callback('PASSWORD_RECOVERY', recoverySession()))
  }

  return {
    data: {
      subscription: {
        unsubscribe: () => authListeners.delete(callback),
      },
    },
  }
}

async function rpc(functionName, parameters = {}) {
  try {
    const { response, payload } = await apiFetch(`/rpc/${functionName}`, {
      method: 'POST',
      body: parameters ?? {},
    })

    return response.ok
      ? { data: payload, error: null }
      : { data: null, error: toError(payload, response) }
  } catch (error) {
    return { data: null, error }
  }
}

const FUNCTION_PATHS = {
  'auth-handler': '/functions/auth-handler',
  'email-service': '/functions/email',
}

async function invoke(functionName, { body } = {}) {
  const path = FUNCTION_PATHS[functionName]

  if (!path) {
    return { data: null, error: new ApiError(`Unknown service: ${functionName}`) }
  }

  try {
    const { response, payload } = await apiFetch(path, {
      method: 'POST',
      body: body ?? {},
    })

    if (!response.ok) {
      const error = toError(payload, response)
      // Keep the shape the pages already use for reading the JSON response.
      error.context = {
        clone: () => ({ json: async () => ({ error: error.message }) }),
      }
      return { data: null, error }
    }

    return { data: payload, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const api = {
  from: (table) => new QueryBuilder(table),
  rpc,
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

export const API_URL = API_BASE

export default api
