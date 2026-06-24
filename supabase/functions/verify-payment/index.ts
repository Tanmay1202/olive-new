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

    // 3. Assign a free room unit for the dates
    const { data: units, error: unitsErr } = await supabaseClient
      .from("room_units")
      .select("id, unit_label")
      .eq("room_type_id", booking.room_type_id)
      .eq("is_active", true);

    if (unitsErr) throw unitsErr;

    let assignedUnitId: string | null = null;

    for (const unit of (units || [])) {
      const { data: overlappingBookings, error: bOverlapErr } = await supabaseClient
        .from("bookings")
        .select("id")
        .eq("room_unit_id", unit.id)
        .eq("status", "confirmed")
        .lt("check_in", booking.check_out)
        .gt("check_out", booking.check_in);

      if (bOverlapErr) throw bOverlapErr;

      const { data: overlappingBlocks, error: blockOverlapErr } = await supabaseClient
        .from("availability_blocks")
        .select("id")
        .eq("room_unit_id", unit.id)
        .lt("start_date", booking.check_out)
        .gt("end_date", booking.check_in);

      if (blockOverlapErr) throw blockOverlapErr;

      if (
        (!overlappingBookings || overlappingBookings.length === 0) &&
        (!overlappingBlocks || overlappingBlocks.length === 0)
      ) {
        assignedUnitId = unit.id;
        break;
      }
    }

    // 4. Update the booking to paid & confirmed
    const { data: updatedBooking, error: updateErr } = await supabaseClient
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        hold_expires_at: null,
        room_unit_id: assignedUnitId,
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: updatedBooking.id,
        assigned_room_unit: assignedUnitId,
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
