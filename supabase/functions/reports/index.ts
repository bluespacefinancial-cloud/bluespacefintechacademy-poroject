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
      const { data: profile } = await supabaseClient
        .from("users")
        .select("type")
        .eq("id", data.user.id)
        .single()
      userRole = profile?.type
      if (userRole !== "Administrator") {
        return new Response(
          JSON.stringify({ error: "Admin only" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/reports", "")

    // Cohort report
    if (req.method === "GET" && path === "/cohorts") {
      const { data, error } = await supabaseClient
        .from("cohorts")
        .select(`
          *,
          enrolments (
            user_id,
            track,
            status
          )
        `)
        .order("start_date", { ascending: true })
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Domain pass rates
    if (req.method === "GET" && path === "/domains") {
      const { data, error } = await supabaseClient
        .from("lesson_progress")
        .select(`
          lessons (
            domain,
            title
          ),
          is_completed,
          completion_percentage
        `)
      if (error) throw error

      const domainStats = {}
      data.forEach((lp) => {
        const domain = lp.lessons?.domain || "Unknown"
        if (!domainStats[domain]) {
          domainStats[domain] = { total: 0, completed: 0, totalProgress: 0 }
        }
        domainStats[domain].total++
        if (lp.is_completed) domainStats[domain].completed++
        domainStats[domain].totalProgress += lp.completion_percentage || 0
      })

      const result = Object.entries(domainStats).map(([domain, stats]) => ({
        domain,
        enrollment: stats.total,
        passRate: Math.round((stats.completed / stats.total) * 100),
        avgCompletion: Math.round(stats.totalProgress / stats.total),
      }))

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Placement stats
    if (req.method === "GET" && path === "/placement") {
      const { data, error } = await supabaseClient
        .from("placements")
        .select(`
          *,
          users (
            name,
            track
          )
        `)
        .order("created_at", { ascending: false })
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Export report (PDF placeholder)
    if (req.method === "POST" && path === "/export") {
      const { report_type } = await req.json()
      return new Response(JSON.stringify({
        report_type,
        generated_at: new Date().toISOString(),
        download_url: null,
        message: "Report generation queued",
      }), {
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
