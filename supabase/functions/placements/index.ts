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
    let userRole = null
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
      const { data: profile } = await supabaseClient
        .from("users")
        .select("type")
        .eq("id", userId)
        .single()
      userRole = profile?.type
    }

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/placements", "")

    // Get all placements (admin) or user's placements
    if (req.method === "GET" && path === "") {
      const query = supabaseClient
        .from("placements")
        .select(*)
        .order("created_at", { ascending: false })
      if (userRole !== "Administrator" && userId) {
        query.eq("user_id", userId)
      }
      const { data, error } = await query
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create placement (admin only)
    if (req.method === "POST" && path === "") {
      if (userRole !== "Administrator") {
        return new Response(
          JSON.stringify({ error: "Admin only" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      const { user_id, role, project_id, start_date } = await req.json()
      const { data, error } = await supabaseClient
        .from("placements")
        .insert({
          user_id,
          role,
          project_id,
          start_date,
          status: "matched",
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Update placement status
    if (req.method === "PUT" && path.startsWith("/status/")) {
      const placementId = path.replace("/status/", "")
      const { status } = await req.json()
      const { data, error } = await supabaseClient
        .from("placements")
        .update({ status })
        .eq("id", placementId)
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
