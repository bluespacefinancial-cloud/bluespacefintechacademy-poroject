import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// ============================================================
// RATE LIMITING - In-memory store (reset on function cold start)
// Max 5 requests per minute per IP address
// ============================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5 // max requests per window

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetAt - now }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/auth-handler", "")

    // Login and applications do not require an existing session.
    if (req.method === "POST" && path === "/login") {
      const clientIp = getClientIp(req)
      const rateLimit = checkRateLimit(clientIp)
      if (!rateLimit.allowed) {
        return json({
          error: `Too many login attempts. Try again in ${rateLimit.resetIn} seconds.`,
          retryAfter: rateLimit.resetIn,
        }, 429)
      }

      const { email, password } = await req.json()
      if (!email || !password) return json({ error: "Missing credentials" }, 400)
      const { data, error } = await admin.auth.signInWithPassword({ email, password })
      if (error) return json({ error: error.message }, 401)
      return json(data)
    }

    if (req.method === "POST" && (path === "/apply" || path === "")) {
      const clientIp = getClientIp(req)
      const rateLimit = checkRateLimit(clientIp)
      if (!rateLimit.allowed) {
        return json({
          error: `Too many application attempts. Try again in ${rateLimit.resetIn} seconds.`,
          retryAfter: rateLimit.resetIn,
        }, 429)
      }
      const body = await req.json()
      if (path === "" && body.action !== "apply") return json({ error: "Not found" }, 404)
      const {
        email, password, name, phone, role, track, organisation, motivation,
        website, teachingDomains, teachingExperience, partnershipFocus, partnershipDetails,
      } = body
      if (!email || !password || !name || !["Student", "Instructor", "Partner"].includes(role)) {
        return json({ error: "name, email, password and a valid role are required" }, 400)
      }
      if (typeof email !== "string" || typeof name !== "string" || typeof password !== "string" || password.length < 8) {
        return json({ error: "Enter a valid email and name, and use a password with at least 8 characters" }, 400)
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 191 || name.trim().length > 191) {
        return json({ error: "Enter a valid email address and a name under 192 characters" }, 400)
      }
      if ((phone && String(phone).length > 191) || (organisation && String(organisation).length > 200) ||
          (motivation && String(motivation).length > 2000) || (website && String(website).length > 500) ||
          (teachingExperience && String(teachingExperience).length > 3000) ||
          (partnershipDetails && String(partnershipDetails).length > 3000)) {
        return json({ error: "One or more application fields are too long" }, 400)
      }
      if (role === "Student" && !["Finsoft", "Finops"].includes(track)) {
        return json({ error: "Students must choose a valid track" }, 400)
      }
      const validTeachingDomains = ["FaaS", "FinCore", "FinOps", "FinInfra"]
      if (role === "Instructor" && (
        !Array.isArray(teachingDomains) || teachingDomains.length === 0 ||
        teachingDomains.some((domain) => !validTeachingDomains.includes(domain)) ||
        typeof teachingExperience !== "string" || !teachingExperience.trim()
      )) {
        return json({ error: "Choose teaching domains and describe your relevant experience" }, 400)
      }
      const validPartnershipFocus = ["Learning content", "Project briefs", "Mentorship", "Internships and hiring", "Other"]
      if (role === "Partner" && (
        typeof organisation !== "string" || !organisation.trim() ||
        !validPartnershipFocus.includes(partnershipFocus) ||
        typeof partnershipDetails !== "string" || !partnershipDetails.trim()
      )) {
        return json({ error: "Partner applications require an organisation, partnership focus, and details" }, 400)
      }
      if (website) {
        try {
          const websiteUrl = new URL(website)
          if (!["http:", "https:"].includes(websiteUrl.protocol)) throw new Error("Unsupported website protocol")
        } catch {
          return json({ error: "Enter a valid website URL" }, 400)
        }
      }
      const normalizedEmail = email.trim().toLowerCase()
      const appOrigin = Deno.env.get("APP_ORIGIN") || req.headers.get("origin")
      const emailRedirectTo = appOrigin
        ? new URL("/student-login?emailVerified=1", appOrigin).toString()
        : undefined
      const { data, error } = await admin.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { type: role, name: name.trim() },
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      })
      if (error) return json({ error: error.message }, 400)
      if (!data.user) return json({ error: "Unable to create account" }, 500)

      const { data: profile, error: profileError } = await admin.from("users").upsert(
        { auth_user_id: data.user.id, name: name.trim(), email: normalizedEmail, type: role, phone: phone || null, is_active: 0 },
        { onConflict: "email" }
      ).select("id").single()
      if (profileError) return json({ error: profileError.message }, 500)

      const { error: applicationError } = await admin.from("academy_applications").insert({
        auth_user_id: data.user.id,
        user_id: profile.id,
        name,
        email: normalizedEmail,
        phone: phone || null,
        requested_role: role,
        track: role === "Student" ? track : null,
        organisation: role === "Partner" ? organisation.trim() : null,
        motivation: motivation || null,
        website: role === "Partner" ? website?.trim() || null : null,
        teaching_domains: role === "Instructor" ? teachingDomains : [],
        teaching_experience: role === "Instructor" ? teachingExperience.trim() : null,
        partnership_focus: role === "Partner" ? partnershipFocus : null,
        partnership_details: role === "Partner" ? partnershipDetails.trim() : null,
      })
      if (applicationError) return json({ error: applicationError.message }, 500)
      return json({ submitted: true, emailConfirmationRequired: !data.user.email_confirmed_at }, 201)
    }

    // Everything below requires a valid session.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const token = authHeader.replace("Bearer ", "")
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData?.user) return json({ error: "Unauthorized" }, 401)

    // public.users.id is a bigint profile id, not the Supabase auth UUID.
    // Bridge by email, matching public.current_profile_id().
    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("id, type, is_active")
      .eq("email", authData.user.email)
      .maybeSingle()
    if (profileError) return json({ error: profileError.message }, 500)

    // Get profile
    if (req.method === "GET" && path === "/profile") {
      if (!profile) return json({ error: "No academy profile for this account" }, 404)
      if (profile.is_active !== 1) return json({ error: "Account deactivated" }, 403)
      return json(profile)
    }

    // Provision a new user. Administrator only.
    if (req.method === "POST" && path === "/signup") {
      if (profile?.type !== "Administrator" || profile?.is_active !== 1) {
        return json({ error: "Administrator only" }, 403)
      }
      const { email, password, type, name } = await req.json()
      if (!email || !password || !["Student", "Instructor", "Partner", "Administrator"].includes(type)) {
        return json({ error: "email, password and a valid type are required" }, 400)
      }
      const { data, error } = await admin.auth.signUp({
        email,
        password,
        options: { data: { type, name } },
      })
      if (error) return json({ error: error.message }, 400)

      // There is no auth.users -> public.users trigger, so create the profile
      // row the role checks depend on.
      const { error: profileInsertError } = await admin.from("users").upsert(
        { name: name || email, email, type, is_active: 1 },
        { onConflict: "email" }
      )
      if (profileInsertError) return json({ error: profileInsertError.message }, 500)

      return json(data, 201)
    }

    return json({ error: "Not found" }, 404)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
