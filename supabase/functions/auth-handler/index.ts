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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/auth-handler", "")

    // Login is the only endpoint that does not require an existing session.
    if (req.method === "POST" && path === "/login") {
      const { email, password } = await req.json()
      if (!email || !password) return json({ error: "Missing credentials" }, 400)
      const { data, error } = await admin.auth.signInWithPassword({ email, password })
      if (error) return json({ error: error.message }, 401)
      return json(data)
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
      if (!email || !password || !["Student", "Instructor", "Administrator"].includes(type)) {
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
