import { supabase, SUPABASE_ANON_KEY, EDGE_FUNCTION_URL } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

async function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function edgeFetch(path, options = {}) {
  const res = await fetch(`${EDGE_FUNCTION_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })
  const data = await res.json()
  if (!res.ok) throw { response: { status: res.status, data } }
  return data
}

async function supabaseQuery(table, { select = '*', filters = [], order = null, single = false, count = false } = {}) {
  let query = supabase.from(table).select(select, { count: count ? 'exact' : undefined })
  for (const f of filters) {
    if (f.op === 'eq') query = query.eq(f.col, f.val)
    else if (f.op === 'neq') query = query.neq(f.col, f.val)
    else if (f.op === 'gte') query = query.gte(f.col, f.val)
    else if (f.op === 'lte') query = query.lte(f.col, f.val)
    else if (f.op === 'gt') query = query.gt(f.col, f.val)
    else if (f.op === 'lt') query = query.lt(f.col, f.val)
    else if (f.op === 'in') query = query.in(f.col, f.val)
    else if (f.op === 'like') query = query.like(f.col, f.val)
    else if (f.op === 'ilike') query = query.ilike(f.col, f.val)
  }
  if (order) query = query.order(order.col, { ascending: order.asc ?? false })
  if (single) query = query.maybeSingle()
  const { data, error, count: cnt } = await query
  if (error) throw error
  return single ? data : (count ? { data, count: cnt } : data)
}

const api = {
  get: async (path, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${supabaseUrl}/rest/v1${path}${query ? '?' + query : ''}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...authHeaders(),
      },
    })
    return res.json()
  },
  post: async (path, body) => {
    const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    })
    return res.json()
  },
  put: async (path, body) => {
    const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    })
    return res.json()
  },
  delete: async (path) => {
    const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...authHeaders(),
      },
    })
    return res.json()
  },
  edgeFetch,
  supabaseQuery,
  supabase,
}

export default api
