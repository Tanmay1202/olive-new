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

    const body = await req.json();
    const {
      room_type_id,
      check_in,
      check_out,
      guest_name,
      guest_email,
      guest_phone,
      guests_count,
      qty,
      notes,
    } = body;

    // --- Input Validation ---
    if (!room_type_id || typeof room_type_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid room_type_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!check_in || !check_out) {
      return new Response(JSON.stringify({ error: "check_in and check_out are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!guest_name || typeof guest_name !== "string" || guest_name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "A valid guest_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!guest_phone || typeof guest_phone !== "string") {
      return new Response(JSON.stringify({ error: "A valid guest_phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guest_email || !emailRegex.test(String(guest_email))) {
      return new Response(JSON.stringify({ error: "A valid guest_email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bookingQty = qty ? Number(qty) : 1;
    const bookingGuestsCount = guests_count ? Number(guests_count) : 1;

    if (isNaN(bookingQty) || bookingQty < 1 || bookingQty > 20) {
      return new Response(JSON.stringify({ error: "Invalid qty value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate room type and get details
    const { data: roomType, error: rtError } = await supabaseClient
      .from("room_types")
      .select("base_price, is_active")
      .eq("id", room_type_id)
      .single();

    if (rtError || !roomType || !roomType.is_active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive room type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Calculate nights and total amount
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid date format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      return new Response(JSON.stringify({ error: "Check-out must be after check-in" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalAmount = Number(roomType.base_price) * nights * bookingQty;

    // 3 & 4. Atomically check availability and create pending booking via RPC
    const { data: bookingId, error: rpcError } = await supabaseClient.rpc("create_pending_booking", {
      p_room_type_id: room_type_id,
      p_check_in: check_in,
      p_check_out: check_out,
      p_guest_name: guest_name.trim(),
      p_guest_email: String(guest_email).trim().toLowerCase(),
      p_guest_phone: String(guest_phone).trim(),
      p_guests_count: bookingGuestsCount,
      p_qty: bookingQty,
      p_total_amount: totalAmount,
      p_notes: notes ? String(notes).trim().slice(0, 1000) : null,
    });

    if (rpcError || !bookingId) {
      if (rpcError?.message?.includes("Selected dates are no longer available")) {
        return new Response(JSON.stringify({ error: rpcError.message }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw rpcError || new Error("Failed to create pending booking");
    }

    const booking = { id: bookingId };

    // 5. Call Razorpay Orders API
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials missing in environment");
    }

    const orderPayload = {
      amount: Math.round(totalAmount * 100), // in paise
      currency: "INR",
      receipt: booking.id,
    };

    const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!rzpResponse.ok) {
      const rzpErrBody = await rzpResponse.text();
      // Clean up the pending booking if Razorpay fails
      await supabaseClient.from("bookings").delete().eq("id", booking.id);
      throw new Error(`Razorpay Order creation failed: ${rzpErrBody}`);
    }

    const rzpOrder = await rzpResponse.json();

    // 6. Update booking with razorpay order id
    const { error: updateError } = await supabaseClient
      .from("bookings")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", booking.id);

    if (updateError) {
      // Issue 2 fix: clean up the orphan booking so it doesn't linger without
      // a razorpay_order_id — the Razorpay order already exists server-side,
      // so without this link the payment can never be confirmed or tracked.
      await supabaseClient.from("bookings").delete().eq("id", booking.id);
      throw new Error(`Failed to link Razorpay order to booking: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        booking_id: booking.id,
        razorpay_order_id: rzpOrder.id,
        amount: orderPayload.amount,
        currency: "INR",
        key_id: razorpayKeyId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
