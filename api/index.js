import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { verifyToken } from './auth.js';
import { sendWelcomeEmail, sendApplicationSubmittedEmail } from './emailService.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const app = express();
// Health check route for UptimeRobot
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://scholaco-five.vercel.app',
    'https://scholaco.tech'
  ],
  credentials: true,
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Contact Form Route ---
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'scholaco1@gmail.com',    
      replyTo: email,               
      subject: `New Scholaco Contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
});

// Welcome email
app.post('/emails/welcome', verifyToken, async (req, res) => {
  const { email, full_name } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ error: 'email and full_name are required' });
  }

  const success = await sendWelcomeEmail(email, full_name);

  if (!success) {
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }

  res.json({ message: 'Welcome email sent' });
});

// Application submitted email
app.post('/emails/application-submitted', verifyToken, async (req, res) => {
  const { app_name } = req.body;
  const userEmail = req.user.email;

  if (!app_name) {
    return res.status(400).json({ error: 'app_name is required' });
  }

  if (!userEmail) {
    return res.status(400).json({ error: 'No email found on user token' });
  }

  const success = await sendApplicationSubmittedEmail(userEmail, app_name);

  if (!success) {
    return res.status(500).json({ error: 'Failed to send confirmation email' });
  }

  res.json({ message: 'Confirmation email sent' });
});

// Boot
startScheduler();

app.listen(PORT, () => {
  console.log(`Scholaco API running on port ${PORT}`);
});