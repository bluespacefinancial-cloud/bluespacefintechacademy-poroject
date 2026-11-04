import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
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

    const authHeader = req.headers.get("Authorization")
    let userId = null
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const { data, error } = await supabaseClient.auth.getUser(token)
      if (error || !data?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      userId = data.user.id
    }

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/submissions", "")

    // Get submissions for a user or lab
    if (req.method === "GET" && path === "") {
      const labId = url.searchParams.get("lab_id")
      const query = supabaseClient
        .from("submissions")
        .select(*)
        .order("submitted_at", { ascending: false })
      if (userId) query.eq("user_id", userId)
      if (labId) query.eq("lab_id", parseInt(labId))
      const { data, error } = await query
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Submit a lab
    if (req.method === "POST" && path === "") {
      const { lab_id, content_url, squad_id } = await req.json()
      if (!userId || !lab_id) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      const { data, error } = await supabaseClient
        .from("submissions")
        .insert({
          user_id: userId,
          lab_id,
          content_url,
          squad_id,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Grade a submission (instructor/admin only)
    if (req.method === "PUT" && path.startsWith("/grade/")) {
      const submissionId = path.replace("/grade/", "")
      const { score, feedback } = await req.json()
      const { data, error } = await supabaseClient
        .from("submissions")
        .update({
          score,
          feedback,
          status: score >= 70 ? "passed" : "failed",
          graded_by: userId,
          graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
