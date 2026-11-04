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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Every endpoint below requires a valid session. Without this gate the
    // service-role client would return every submission to anonymous callers.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const token = authHeader.replace("Bearer ", "")
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !authData?.user) return json({ error: "Unauthorized" }, 401)

    // public.users.id is a bigint profile id, not the Supabase auth UUID.
    // Bridge by email, matching public.current_profile_id().
    const { data: profile, error: profileError } = await supabaseClient
      .from("users")
      .select("id, type")
      .eq("email", authData.user.email)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile) return json({ error: "No academy profile for this account" }, 403)

    const profileId = profile.id
    const isStaff = profile.type === "Instructor" || profile.type === "Administrator"

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/submissions", "")

    // Get submissions. Students only ever see their own.
    if (req.method === "GET" && path === "") {
      const labId = url.searchParams.get("lab_id")
      let query = supabaseClient
        .from("submissions")
        .select("*")
        .order("submitted_at", { ascending: false })
      if (!isStaff) query = query.eq("user_id", profileId)
      if (labId) query = query.eq("lab_id", parseInt(labId, 10))
      const { data, error } = await query
      if (error) throw error
      return json(data)
    }

    // Submit a lab. Always attributed to the caller, never to a body-supplied id.
    if (req.method === "POST" && path === "") {
      const { lab_id, content_url, squad_id } = await req.json()
      if (!lab_id) return json({ error: "Missing required fields" }, 400)
      const { data, error } = await supabaseClient
        .from("submissions")
        .insert({
          user_id: profileId,
          lab_id,
          content_url,
          squad_id,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select("*")
      if (error) throw error
      return json(data?.[0] ?? null, 201)
    }

    // Grade a submission. Instructor or administrator only.
    if (req.method === "PUT" && path.startsWith("/grade/")) {
      if (!isStaff) return json({ error: "Instructor or administrator only" }, 403)
      const submissionId = path.replace("/grade/", "")
      const { score, feedback } = await req.json()
      if (typeof score !== "number" || score < 0 || score > 100) {
        return json({ error: "score must be a number between 0 and 100" }, 400)
      }
      const { data, error } = await supabaseClient
        .from("submissions")
        .update({
          score,
          feedback,
          status: score >= 70 ? "passed" : "failed",
          graded_by: profileId,
          graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select("*")
      if (error) throw error
      return json(data?.[0] ?? null)
    }

    return json({ error: "Not found" }, 404)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
