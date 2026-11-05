import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('APP_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('EMAIL_FROM')
    if (!supabaseUrl || !anonKey || !serviceKey || !resendKey || !from) {
      return json({ error: 'Email delivery is not configured on the server' }, 503)
    }

    const authorization = req.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
    const token = authorization.slice('Bearer '.length)
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const { data: authResult, error: authError } = await authClient.auth.getUser(token)
    const authUser = authResult.user
    if (authError || !authUser?.email) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('type, is_active')
      .eq('email', authUser.email)
      .maybeSingle()
    if (profileError || !profile || Number(profile.is_active) !== 1) return json({ error: 'Active academy account required' }, 403)

    const body = await req.json()
    const { to, subject, html, text } = body
    if (typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
        typeof subject !== 'string' || !subject.trim() || subject.length > 200 ||
        typeof html !== 'string' || html.length > 100_000 ||
        (text !== undefined && (typeof text !== 'string' || text.length > 20_000))) {
      return json({ error: 'A valid recipient, subject, and email body are required' }, 400)
    }
    if (profile.type !== 'Administrator' && to.toLowerCase() !== authUser.email.toLowerCase()) {
      return json({ error: 'Only administrators can send email to other recipients' }, 403)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: subject.trim(), html, ...(text ? { text } : {}) }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      const providerMessage = typeof result?.message === 'string' ? result.message : 'No provider details were returned'
      console.error('Resend rejected email', { status: response.status, message: providerMessage })
      return json({ error: `Email provider rejected the request (${response.status}): ${providerMessage}` }, 502)
    }
    return json({ sent: true, data: result }, 202)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Email delivery failed' }, 500)
  }
})
