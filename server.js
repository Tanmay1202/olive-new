import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config(); // Load variables from .env file

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, phone, city, bookingType, date } = req.body;

  try {
    const info = await transporter.sendMail({
      from: `"Olive Green Website" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `New Booking Enquiry from ${name}`,
      text: `
You have received a new booking enquiry from the website:

Name: ${name}
Phone: ${phone}
City: ${city}
Booking Type: ${bookingType}
Date requested: ${date}
      `,
      html: `
        <h2>New Booking Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>City:</strong> ${city}</p>
        <p><strong>Booking Type:</strong> ${bookingType}</p>
        <p><strong>Date:</strong> ${date}</p>
      `
    });

    console.log('Message sent: %s', info.messageId);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

app.listen(port, () => {
  console.log(`Email backend server running at http://localhost:${port}`);
  console.log('IMPORTANT: Make sure to update YOUR_GMAIL_APP_PASSWORD_HERE in server.js before sending emails.');
});
