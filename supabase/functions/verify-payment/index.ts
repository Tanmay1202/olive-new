import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Constant-time string comparison to prevent timing attacks */
function safeStringEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing checkout callback payload parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify Razorpay Signature using constant-time comparison
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(body)
    );
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (!safeStringEquals(generatedSignature, razorpay_signature)) {
      return new Response(JSON.stringify({ error: "Payment verification failed. Invalid signature." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch the corresponding pending booking
    const { data: booking, error: fetchError } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchError || !booking) {
      return new Response(JSON.stringify({ error: "Booking record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: already confirmed (e.g., webhook already handled it)
    if (booking.status === "confirmed") {
      return new Response(
        JSON.stringify({ success: true, booking_id: booking.id, message: "Booking already confirmed." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3 & 4. Atomically assign units and update the booking to confirmed & paid via RPC
    const { data: confirmSuccess, error: confirmError } = await supabaseClient.rpc(
      "confirm_booking_and_assign_units",
      {
        p_booking_id: booking.id,
        p_payment_id: razorpay_payment_id,
      }
    );

    if (confirmError || !confirmSuccess) {
      throw confirmError || new Error("Failed to confirm booking and assign units");
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );


  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
