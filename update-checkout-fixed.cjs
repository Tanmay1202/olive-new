
const fs = require("fs");

let code = fs.readFileSync("src/main.jsx", "utf-8");

const startStr = `function BookingSection({ title, copy, showHighlights = true }) {`;
const endStr = `function BookingPage() {`;

const parts = code.split(endStr);
const beforePart = parts[0].split(startStr)[0];

const replacement = `function BookingSection({ title, copy, showHighlights = true }) {
  const [booking, setBooking] = useState(initialBooking);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  
  // Checkout specific state
  const [showCheckout, setShowCheckout] = useState(false);
  const [withBreakfast, setWithBreakfast] = useState(false);

  const updateBooking = (event) => {
    const { name, value } = event.target;
    setBooking((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitted(false);
  };

  const validateBooking = () => {
    const nextErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arrival = booking.arrival ? new Date(booking.arrival) : null;
    const departure = booking.departure ? new Date(booking.departure) : null;

    if (!arrival) nextErrors.arrival = "Required";
    else if (arrival < today) nextErrors.arrival = "Cannot be in the past";

    if (!departure) nextErrors.departure = "Required";
    else if (arrival && departure <= arrival) nextErrors.departure = "Must be after check-in";

    if (!booking.name.trim()) nextErrors.name = "Required";
    if (!booking.phone.trim()) nextErrors.phone = "Required";
    if (!booking.email.trim()) nextErrors.email = "Required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i.test(booking.email)) nextErrors.email = "Invalid address";

    return nextErrors;
  };

  useEffect(() => {
    const fetchRooms = async () => {
      if (!booking.arrival || !booking.departure) return;
      const arrivalDate = new Date(booking.arrival);
      const departureDate = new Date(booking.departure);
      if (departureDate <= arrivalDate) return;

      setLoadingRooms(true);
      try {
        const { data, error } = await supabase.rpc("get_room_types_with_availability", {
          p_check_in: booking.arrival,
          p_check_out: booking.departure
        });

        if (error) throw error;
        setAvailableRooms(data || []);
      } catch (err) {
        console.error("Error fetching available rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [booking.arrival, booking.departure]);

  useEffect(() => {
    if (availableRooms.length > 0) {
      const isRoomSelection = availableRooms.some(r => r.name === booking.stayType && r.is_available);
      const isEventSelection = eventChoices.includes(booking.stayType);

      if (!isRoomSelection && !isEventSelection) {
        const firstAvailable = availableRooms.find(r => r.is_available);
        if (firstAvailable) {
          setBooking(current => ({ ...current, stayType: firstAvailable.name }));
        }
      }
    }
  }, [availableRooms]);

  const handleProceedToCheckout = (event) => {
    event.preventDefault();
    const nextErrors = validateBooking();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const selectedRoom = availableRooms.find(r => r.name === booking.stayType);
    if (!selectedRoom) {
      // It\x27s an event enquiry
      setSuccessInfo({
        title: "Enquiry received.",
        detail: \`We have captured your \${booking.stayType?.toLowerCase()} request for \${booking.guests} guest(s). Olive Green will follow up with details.\`
      });
      setSubmitted(true);
      return;
    }
    
    setShowCheckout(true);
  };

  const handlePayNow = async () => {
    const selectedRoom = availableRooms.find(r => r.name === booking.stayType);
    if (!selectedRoom) return;

    setPaying(true);
    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-booking-order", {
        body: {
          room_type_id: selectedRoom.id,
          check_in: booking.arrival,
          check_out: booking.departure,
          guest_name: booking.name,
          guest_email: booking.email,
          guest_phone: booking.phone,
          guests_count: Number(booking.guests || 2),
          qty: Number(booking.rooms || 1),
          notes: booking.notes,
          with_breakfast: withBreakfast
        }
      });

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create booking order");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Olive Green Resort & Villas",
        description: \`Booking for \${selectedRoom.name}\`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: booking.name,
          email: booking.email,
          contact: booking.phone
        },
        handler: async (response) => {
          setPaying(true);
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });

            if (verifyError || !verifyData || !verifyData.success) {
              throw new Error(verifyError?.message || "Payment verification failed");
            }

            setSuccessInfo({
              title: "Booking Confirmed!",
              detail: \`Your booking for \${selectedRoom.name} from \${booking.arrival} to \${booking.departure} is confirmed. Payment ID: \${response.razorpay_payment_id}.\`
            });
            setSubmitted(true);
            setShowCheckout(false);
          } catch (err) {
            console.error("Verification error:", err);
            setErrors({ submit: err.message || "Payment verification failed. Please contact support." });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setErrors({ submit: "Checkout was cancelled. You can try paying again." });
          }
        },
        theme: {
          color: "#4f661f"
        }
      };

      openRazorpayCheckout(options);
    } catch (err) {
      console.error("Order creation error:", err);
      setErrors({ submit: err.message || "Failed to initiate booking payment." });
      setPaying(false);
    }
  };

  const selectedRoom = availableRooms.find(r => r.name === booking.stayType);

  let nights = 0;
  let roomSubtotal = 0;
  let roomGST = 0;
  let breakfastSubtotal = 0;
  let breakfastGST = 0;
  let totalAmount = 0;

  if (showCheckout && selectedRoom) {
    const arrivalDate = new Date(booking.arrival);
    const departureDate = new Date(booking.departure);
    nights = Math.round((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    roomSubtotal = Number(selectedRoom.base_price) * nights * Number(booking.rooms || 1);
    roomGST = Math.round(roomSubtotal * 0.18);
    
    if (withBreakfast) {
      breakfastSubtotal = 500 * nights * Number(booking.guests || 2);
      breakfastGST = Math.round(breakfastSubtotal * 0.18);
    }
    
    totalAmount = roomSubtotal + roomGST + breakfastSubtotal + breakfastGST;
  }

  if (showCheckout && selectedRoom) {
    return (
      <section className="booking page-section checkout-section">
        <div className="checkout-container">
          <button className="back-btn" onClick={() => setShowCheckout(false)}>&larr; Back to details</button>
          
          <div className="checkout-grid">
            <div className="checkout-details">
              <h3>Order Summary</h3>
              <div className="summary-card">
                <h4>{selectedRoom.name}</h4>
                <p>{booking.rooms} Room{booking.rooms > 1 ? "s" : ""} • {booking.guests} Guest{booking.guests > 1 ? "s" : ""}</p>
                <div className="dates-row">
                  <div>
                    <span className="tiny-label">Check-in</span>
                    <strong>{new Date(booking.arrival).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                  </div>
                  <ArrowRight size={16} style={{ marginTop: "16px" }} />
                  <div>
                    <span className="tiny-label">Check-out</span>
                    <strong>{new Date(booking.departure).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                  </div>
                </div>
              </div>

              <h3>Meal Plan</h3>
              <div className="meal-options">
                <label className={\`meal-option \${!withBreakfast ? "selected" : ""}\`}>
                  <input type="radio" name="meal" checked={!withBreakfast} onChange={() => setWithBreakfast(false)} />
                  <div>
                    <strong>Room Only</strong>
                    <span>No meals included</span>
                  </div>
                </label>
                <label className={\`meal-option \${withBreakfast ? "selected" : ""}\`}>
                  <input type="radio" name="meal" checked={withBreakfast} onChange={() => setWithBreakfast(true)} />
                  <div>
                    <strong>Room + Breakfast</strong>
                    <span>₹500 / guest / night</span>
                  </div>
                </label>
              </div>

              <h3>Guest Details</h3>
              <div className="guest-info-card">
                <p><strong>{booking.name}</strong></p>
                <p>{booking.email}</p>
                <p>{booking.phone}</p>
              </div>
            </div>

            <div className="checkout-sidebar">
              <h3>Price Breakdown</h3>
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Room Charges ({nights} Night{nights > 1 ? "s" : ""})</span>
                  <span>₹{roomSubtotal.toLocaleString()}</span>
                </div>
                {withBreakfast && (
                  <div className="price-row">
                    <span>Breakfast Charges</span>
                    <span>₹{breakfastSubtotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="price-row taxes">
                  <span>Room GST (18%)</span>
                  <span>₹{roomGST.toLocaleString()}</span>
                </div>
                {withBreakfast && (
                  <div className="price-row taxes">
                    <span>Breakfast GST (18%)</span>
                    <span>₹{breakfastGST.toLocaleString()}</span>
                  </div>
                )}
                <div className="price-row total">
                  <strong>Total Amount</strong>
                  <strong>₹{totalAmount.toLocaleString()}</strong>
                </div>
              </div>
              
              {errors.submit && (
                <div className="form-error-msg" style={{ marginTop: "24px" }}>
                  {errors.submit}
                </div>
              )}

              <button className="checkout-pay-btn" onClick={handlePayNow} disabled={paying}>
                {paying ? "Processing Securely..." : \`Pay ₹\${totalAmount.toLocaleString()}\`}
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
      <section className="booking page-section">
        <div className="booking-copy">
          <span className="tiny-label">Booking enquiry</span>
          <h2>{title || "Start with the dates."}</h2>
          {showHighlights && (
            <div className="booking-highlights">
              <span><CalendarDays size={18} /> Date-led request</span>
              <span><BedDouble size={18} /> Rooms / villas</span>
              <span><Sparkles size={18} /> Quick confirmation</span>
            </div>
          )}
        </div>
        <form className="booking-form" onSubmit={handleProceedToCheckout} noValidate>
            <label>
              <span>Check in</span>
              <input type="date" name="arrival" value={booking.arrival} onChange={updateBooking} min={new Date().toISOString().split("T")[0]} />
              {errors.arrival && <small>{errors.arrival}</small>}
            </label>
            <label>
              <span>Check out</span>
              <input type="date" name="departure" value={booking.departure} onChange={updateBooking} min={booking.arrival || new Date().toISOString().split("T")[0]} />
              {errors.departure && <small>{errors.departure}</small>}
            </label>
            
            <label className="full-width">
              <span>Room Type / Accommodation</span>
              <select name="stayType" value={booking.stayType} onChange={updateBooking} disabled={!booking.arrival || !booking.departure || loadingRooms}>
                <option value="" disabled>{loadingRooms ? "Loading availability..." : (!booking.arrival || !booking.departure ? "Select dates first" : "Choose a room")}</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.name} disabled={!r.is_available}>
                    {r.name} {r.is_available ? "" : "(Sold out)"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Guests</span>
              <input type="number" name="guests" min="1" max="80" value={booking.guests} onChange={updateBooking} />
            </label>
            <label>
              <span>Rooms</span>
              <input type="number" name="rooms" min="1" max="20" value={booking.rooms} onChange={updateBooking} />
            </label>
            <label>
              <span>Lead guest name</span>
              <input type="text" name="name" value={booking.name} onChange={updateBooking} placeholder="Your name" />
              {errors.name && <small>{errors.name}</small>}
            </label>
            <label>
              <span>Phone</span>
              <input type="tel" name="phone" value={booking.phone} onChange={updateBooking} placeholder="+91 98765 43210" />
              {errors.phone && <small>{errors.phone}</small>}
            </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={booking.email} onChange={updateBooking} placeholder="name@example.com" />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label>
            <span>Special requests</span>
            <textarea name="notes" rows="4" value={booking.notes} onChange={updateBooking} placeholder="Early check-in, extra bed, dietary notes or anything the team should know." />
          </label>

          {errors.submit && (
            <div className="form-error-msg">
              {errors.submit}
            </div>
          )}

          <button type="submit">
            Proceed to Checkout
            <ArrowRight size={19} />
          </button>
          
          {submitted && successInfo && (
            <motion.div
              className="booking-confirmation"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <strong>{successInfo.title}</strong>
              <span>{successInfo.detail}</span>
            </motion.div>
          )}
        </form>
      </section>
  );
}
`;

code = beforePart + replacement + "\n" + endStr + parts[1];
fs.writeFileSync("src/main.jsx", code, "utf-8");
console.log("Success");
