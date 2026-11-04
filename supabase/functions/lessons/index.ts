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
    const path = url.pathname.replace("/functions/v1/lessons", "")

    // Get lessons for a module
    if (req.method === "GET" && path === "") {
      const moduleId = url.searchParams.get("module_id")
      const { data, error } = await supabaseClient
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true })
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get lesson progress
    if (req.method === "GET" && path === "/progress") {
      const lessonId = url.searchParams.get("lesson_id")
      if (!userId || !lessonId) {
        return new Response(
          JSON.stringify({ error: "Missing user_id or lesson_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      const { data, error } = await supabaseClient
        .from("lesson_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lesson_id", parseInt(lessonId))
        .single()
      if (error && error.code !== "PGRST116") throw error
      return new Response(JSON.stringify(data || null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Save progress
    if (req.method === "POST" && path === "/progress") {
      const { lesson_id, watch_time_seconds, completion_percentage, is_completed, last_position_seconds } = await req.json()
      if (!userId || !lesson_id) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      const completed_at = is_completed ? new Date().toISOString() : null
      const { data, error } = await supabaseClient
        .from("lesson_progress")
        .upsert({
          user_id: userId,
          lesson_id,
          watch_time_seconds,
          completion_percentage,
          is_completed,
          last_position_seconds,
          completed_at,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id, lesson_id" })
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
