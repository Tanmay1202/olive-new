import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Sanitize helper to prevent huge inputs and basic HTML injection
  const sanitize = (val, maxLen = 100) => {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    return str.substring(0, maxLen).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  const isTourLead = Boolean(req.body.isTourLead);
  const isEventLead = Boolean(req.body.isEventLead);
  const name = sanitize(req.body.name);
  const phone = sanitize(req.body.phone, 20);
  const city = sanitize(req.body.city, 50);
  const bookingType = sanitize(req.body.bookingType, 50);
  const eventType = sanitize(req.body.eventType, 50);
  const date = sanitize(req.body.date, 50);
  const from = sanitize(req.body.from, 100);
  const to = sanitize(req.body.to, 100);
  const pax = sanitize(req.body.pax, 10);

  if (isTourLead) {
    if (!from || !to || !date || !pax || !phone) {
      return res.status(400).json({ error: "All fields are required for tour lead and must be valid." });
    }
  } else if (isEventLead) {
    if (!name || !phone || !eventType || !pax || !date) {
      return res.status(400).json({ error: "All fields are required for event enquiry." });
    }
  } else {
    if (!name || !phone || !city || !bookingType || !date) {
      return res.status(400).json({ error: "All fields are required and must be valid." });
    }
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    let mailOptions = {};
    if (isTourLead) {
      mailOptions = {
        from: `"Olive Green Website" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `New Tour Package Lead - ${phone}`,
        text: `New Tour Package Lead:\n\nPhone: ${phone}\nFrom: ${from}\nTo: ${to}\nDate: ${date}\nPax: ${pax}`,
        html: `
          <h2>New Tour Package Lead</h2>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>From:</strong> ${from}</p>
          <p><strong>To:</strong> ${to}</p>
          <p><strong>Travel Date:</strong> ${date}</p>
          <p><strong>Pax:</strong> ${pax}</p>
        `,
      };
    } else if (isEventLead) {
      mailOptions = {
        from: `"Olive Green Website" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `New Event Enquiry from ${name}`,
        text: `New Event Enquiry:\n\nName: ${name}\nPhone: ${phone}\nEvent Type: ${eventType}\nExpected Guests (Pax): ${pax}\nDate: ${date}`,
        html: `
          <h2>New Event Enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Event Type:</strong> ${eventType}</p>
          <p><strong>Expected Guests (Pax):</strong> ${pax}</p>
          <p><strong>Date:</strong> ${date}</p>
        `,
      };
    } else {
      mailOptions = {
        from: `"Olive Green Website" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `New Booking Enquiry from ${name}`,
        text: `New booking enquiry:\n\nName: ${name}\nPhone: ${phone}\nCity: ${city}\nBooking Type: ${bookingType}\nDate: ${date}`,
        html: `
          <h2>New Booking Enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Booking Type:</strong> ${bookingType}</p>
          <p><strong>Date:</strong> ${date}</p>
        `,
      };
    }

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ error: "Failed to send email." });
  }
}
