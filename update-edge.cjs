
const fs = require("fs");
let code = fs.readFileSync("supabase/functions/create-booking-order/index.ts", "utf-8");

const oldCode = `    const totalAmount = Number(roomType.base_price) * nights * bookingQty;

    // 3 & 4. Atomically check availability and create pending booking via RPC`;

const newCode = `    const withBreakfast = Boolean(body.with_breakfast);
    
    let roomSubtotal = Number(roomType.base_price) * nights * bookingQty;
    let roomGST = Math.round(roomSubtotal * 0.18);
    
    let breakfastSubtotal = 0;
    let breakfastGST = 0;

    if (withBreakfast) {
      breakfastSubtotal = 500 * nights * bookingGuestsCount;
      breakfastGST = Math.round(breakfastSubtotal * 0.18);
    }
    
    const totalAmount = roomSubtotal + roomGST + breakfastSubtotal + breakfastGST;
    
    let finalNotes = notes ? String(notes).trim().slice(0, 950) : "";
    if (withBreakfast) {
      finalNotes = (finalNotes + "\\n\\n[Meal Plan: Room + Breakfast]").trim();
    } else {
      finalNotes = (finalNotes + "\\n\\n[Meal Plan: Room Only]").trim();
    }

    // 3 & 4. Atomically check availability and create pending booking via RPC`;

code = code.replace(oldCode, newCode);

const rpcOldCode = `p_notes: notes ? String(notes).trim().slice(0, 1000) : null,`;
const rpcNewCode = `p_notes: finalNotes || null,`;

code = code.replace(rpcOldCode, rpcNewCode);

fs.writeFileSync("supabase/functions/create-booking-order/index.ts", code, "utf-8");
console.log("Edge function updated.");
