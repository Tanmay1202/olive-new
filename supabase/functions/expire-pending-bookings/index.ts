import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Security: validate a shared cron secret so this endpoint
    // cannot be triggered by arbitrary public HTTP requests.
    // IMPORTANT: if CRON_SECRET is not set in Supabase secrets, ALL requests are rejected.
    // Run: supabase secrets set CRON_SECRET=<random-string>
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const incomingSecret = req.headers.get("x-cron-secret") ?? "";

    if (!cronSecret || incomingSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from("bookings")
      .update({
        status: "expired",
        updated_at: now,
      })
      .eq("status", "pending")
      .lt("hold_expires_at", now)
      .select("id");

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: data?.length || 0,
        expired_bookings: data?.map((b) => b.id) || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
