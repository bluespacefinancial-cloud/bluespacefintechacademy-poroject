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
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const { data, error } = await supabaseClient.auth.getUser(token)
      if (error || !data?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    const url = new URL(req.url)
    const path = url.pathname.replace("/functions/v1/auth-handler", "")

    // Login
    if (req.method === "POST" && path === "/login") {
      const { email, password } = await req.json()
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Sign up
    if (req.method === "POST" && path === "/signup") {
      const { email, password, type, name } = await req.json()
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { type, name } }
      })
      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get profile
    if (req.method === "GET" && path === "/profile") {
      const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", (await supabaseClient.auth.getUser()).data.user?.id)
        .single()
      if (error) throw error
      return new Response(JSON.stringify(data), {
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
