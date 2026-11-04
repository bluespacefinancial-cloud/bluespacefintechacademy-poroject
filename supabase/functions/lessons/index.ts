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

    // Every endpoint requires a valid session.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const token = authHeader.replace("Bearer ", "")
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData?.user) return json({ error: "Unauthorized" }, 401)

    // Query as the caller, not as service_role, so RLS applies to lessons and
    // lesson_progress instead of being bypassed.
    const db = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    // public.users.id is a bigint profile id, not the auth UUID.
    const { data: profile } = await db
      .from("users")
      .select("id, is_active")
      .eq("email", authData.user.email)
      .maybeSingle()
    if (!profile) return json({ error: "No academy profile for this account" }, 403)
    if (profile.is_active !== 1) return json({ error: "Account deactivated" }, 403)

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/lessons", "")

    // Get lessons for a module (RLS limits this to visible modules).
    if (req.method === "GET" && path === "") {
      const moduleId = url.searchParams.get("module_id")
      if (!moduleId) return json({ error: "module_id is required" }, 400)
      const { data, error } = await db
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true })
      if (error) return json({ error: error.message }, 403)
      return json(data)
    }

    // Get lesson progress for the caller.
    if (req.method === "GET" && path === "/progress") {
      const lessonId = url.searchParams.get("lesson_id")
      if (!lessonId) return json({ error: "lesson_id is required" }, 400)
      const { data, error } = await db
        .from("lesson_progress")
        .select("*")
        .eq("user_id", profile.id)
        .eq("lesson_id", parseInt(lessonId, 10))
        .maybeSingle()
      if (error) return json({ error: error.message }, 403)
      return json(data ?? null)
    }

    // Save lesson progress for the caller.
    if (req.method === "POST" && path === "/progress") {
      const body = await req.json()
      if (!body.lesson_id) return json({ error: "lesson_id is required" }, 400)
      const { data, error } = await db
        .from("lesson_progress")
        .upsert(
          {
            user_id: profile.id,
            lesson_id: body.lesson_id,
            watch_time_seconds: body.watch_time_seconds,
            completion_percentage: body.completion_percentage,
            is_completed: body.is_completed,
            last_position_seconds: body.last_position_seconds,
            completed_at: body.is_completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, lesson_id" }
        )
        .select("*")
      if (error) return json({ error: error.message }, 403)
      return json(data?.[0] ?? null)
    }

    return json({ error: "Not found" }, 404)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
