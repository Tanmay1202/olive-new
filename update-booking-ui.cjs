const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const regex = /const handleProceedToCheckout = \(event\) => \{[\s\S]*?setShowCheckout\(true\);\s*\};/;

const newHandleProceed = `const handleProceedToCheckout = (event) => {
    event.preventDefault();
    const nextErrors = validateBooking();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const isEventSelection = eventChoices.includes(booking.stayType);
    if (isEventSelection) {
      // It's an event enquiry
      setSuccessInfo({
        title: "Enquiry received.",
        detail: \`We have captured your \${booking.stayType?.toLowerCase()} request for \${booking.guests} guest(s). Olive Green will follow up with details.\`
      });
      setSubmitted(true);
      return;
    }
    
    const selectedRoom = availableRooms.find(r => r.name === booking.stayType && r.is_available);
    if (!selectedRoom) {
      setErrors({ ...nextErrors, submit: "Sorry, all rooms are occupied for the selected duration." });
      return;
    }
    
    setShowCheckout(true);
  };`;

content = content.replace(regex, newHandleProceed);
fs.writeFileSync('src/main.jsx', content, 'utf8');
