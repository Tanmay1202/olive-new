import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
    const signature = req.headers.get("X-Razorpay-Signature") ?? "";
    const rawBody = await req.text();

    // 1. Verify Webhook Signature using constant-time comparison
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
      new TextEncoder().encode(rawBody)
    );
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (!safeStringEquals(generatedSignature, signature)) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventData = JSON.parse(rawBody);
    const event = eventData.event;

    if (event === "payment.captured") {
      const payment = eventData.payload?.payment?.entity;
      if (!payment) throw new Error("Malformed webhook payload: missing payment entity");

      const orderId = payment.order_id;
      const paymentId = payment.id;

      const { data: booking, error: fetchError } = await supabaseClient
        .from("bookings")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .single();

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: "Booking not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Idempotency — already confirmed, skip processing
      if (booking.status !== "confirmed") {
        const { data: units, error: unitsErr } = await supabaseClient
          .from("room_units")
          .select("id, unit_label")
          .eq("room_type_id", booking.room_type_id)
          .eq("is_active", true);

        if (unitsErr) throw unitsErr;

        let assignedUnitId: string | null = null;

        for (const unit of (units || [])) {
          const { data: overlappingBookings } = await supabaseClient
            .from("bookings")
            .select("id")
            .eq("room_unit_id", unit.id)
            .eq("status", "confirmed")
            .lt("check_in", booking.check_out)
            .gt("check_out", booking.check_in);

          const { data: overlappingBlocks } = await supabaseClient
            .from("availability_blocks")
            .select("id")
            .eq("room_unit_id", unit.id)
            .lt("start_date", booking.check_out)
            .gt("end_date", booking.check_in);

          if (
            (!overlappingBookings || overlappingBookings.length === 0) &&
            (!overlappingBlocks || overlappingBlocks.length === 0)
          ) {
            assignedUnitId = unit.id;
            break;
          }
        }

        const { error: updateErr } = await supabaseClient
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            hold_expires_at: null,
            room_unit_id: assignedUnitId,
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        if (updateErr) throw updateErr;
      }
    } else if (event === "payment.failed") {
      const payment = eventData.payload?.payment?.entity;
      if (!payment) throw new Error("Malformed webhook payload: missing payment entity");

      const orderId = payment.order_id;

      const { error: updateErr } = await supabaseClient
        .from("bookings")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", orderId)
        .eq("status", "pending"); // Only update if not yet confirmed

      if (updateErr) throw updateErr;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
