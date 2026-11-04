import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
}

const ROLES = ["Project Manager", "Field Lead", "UAT", "Technical Specialist"]
const STATUSES = ["matched", "interviewing", "placed", "completed"]

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Every endpoint requires a valid session.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const token = authHeader.replace("Bearer ", "")
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !authData?.user) return json({ error: "Unauthorized" }, 401)

    // public.users.id is a bigint profile id, not the auth UUID.
    const { data: profile, error: profileError } = await supabaseClient
      .from("users")
      .select("id, type, is_active")
      .eq("email", authData.user.email)
      .maybeSingle()
    if (profileError) return json({ error: profileError.message }, 500)
    if (!profile || profile.is_active !== 1) return json({ error: "No active academy profile" }, 403)

    const profileId = profile.id
    const isAdmin = profile.type === "Administrator"

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/placements", "")

    // Get all placements (admin) or the caller's own placements.
    if (req.method === "GET" && path === "") {
      let query = supabaseClient
        .from("placements")
        .select("*")
        .order("created_at", { ascending: false })
      if (!isAdmin) query = query.eq("user_id", profileId)
      const { data, error } = await query
      if (error) throw error
      return json(data)
    }

    // Create placement (admin only).
    if (req.method === "POST" && path === "") {
      if (!isAdmin) return json({ error: "Admin only" }, 403)
      const { certification_id, user_id, role, project_id, start_date } = await req.json()
      if (!certification_id || !user_id || !ROLES.includes(role)) {
        return json({ error: "certification_id, user_id and a valid role are required" }, 400)
      }
      const { data, error } = await supabaseClient
        .from("placements")
        .insert({
          certification_id,
          user_id,
          role,
          project_id,
          start_date,
          status: "matched",
        })
        .select("*")
      if (error) throw error
      return json(data?.[0] ?? null, 201)
    }

    // Update placement status (admin only).
    if (req.method === "PUT" && path.startsWith("/status/")) {
      if (!isAdmin) return json({ error: "Admin only" }, 403)
      const placementId = path.replace("/status/", "")
      const { status } = await req.json()
      if (!STATUSES.includes(status)) {
        return json({ error: `status must be one of: ${STATUSES.join(", ")}` }, 400)
      }
      const { data, error } = await supabaseClient
        .from("placements")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", placementId)
        .select("*")
      if (error) throw error
      return json(data?.[0] ?? null)
    }

    return json({ error: "Not found" }, 404)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
