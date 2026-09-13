import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, city, bookingType, date, from, to, pax, isTourLead } = req.body;

  if (isTourLead) {
    if (!from || !to || !date || !pax || !phone) {
      return res.status(400).json({ error: "All fields are required for tour lead." });
    }
  } else {
    if (!name || !phone || !city || !bookingType || !date) {
      return res.status(400).json({ error: "All fields are required." });
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
