# 🎓 Scholaco

> **Track Your Path to Success.** <br>
> A purpose-built architecture for managing global graduate school applications, tracking critical deadlines, and automating transactional reminders.

## 📖 Overview

Navigating fully-funded graduate programs and international scholarships requires precision. Missing a single deadline or forgetting to submit a supplementary document can cost thousands of dollars in potential awards.

**Scholaco** is a robust, full-stack application designed to eliminate that friction. It provides a centralized dashboard to track application statuses, financial potential, and organizational details, powered by an automated Node.js cron-engine that ensures you never miss a deadline.

## ✨ Core Features

  * **Real-Time Application Tracking:** Monitor application statuses (Not Started, In Progress, Awaiting Response), award amounts, and deadlines in a unified dashboard.
  * **Automated Cron Engine:** A dedicated Node.js background worker sweeps the database minute-by-minute to dispatch scheduled reminders and deadline countdowns.
  * **Transactional Email System:** Clean, responsive HTML email templates for welcome sequences, deadline warnings, and custom reminders (Currently powered by Nodemailer, architected for Brevo).
  * **Bulletproof Authentication:** Secure user sessions powered by Supabase Auth, ensuring strict data isolation.

## 🛠️ Architecture & Tech Stack

Scholaco is built using a decoupled Backend-as-a-Service (BaaS) architecture, splitting the client UI from the background worker.

### Frontend (Client UI)

  * **Framework:** Vite + Vanilla JavaScript
  * **Styling:** Tailwind CSS
  * **Hosting:** Vercel

### Backend (Scheduler & Email Engine)

  * **Runtime:** Node.js
  * **Routing/Server:** Express (Configured as a heartbeat server to prevent idle-sleep)
  * **Email Carrier:** Nodemailer + Google SMTP (Beta) / Brevo API (Production)
  * **Hosting:** Render + UptimeRobot (Keep-alive ping)

### Database & Auth

  * **Provider:** Supabase (PostgreSQL)
  * **Security:** Row Level Security (RLS) + Environment Variable Segregation

-----

## 🚀 Local Development Setup

To run Scholaco locally, you will need two terminal windows to run the frontend and the backend worker simultaneously.

### 1\. Clone the Repository

```bash
git clone https://github.com/your-username/scholaco.git
cd scholaco
```

### 2\. Frontend Setup

Install the client dependencies and configure your environment:

```bash
npm install
```

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the Vite development server:

```bash
npm run dev
```

### 3\. Backend Setup

Navigate to the API folder and install the server dependencies:

```bash
cd api
npm install
```

Create an `.env` file strictly inside the `api/` directory:

```env
# Database (CRITICAL: Use the Service Role Key to bypass RLS for the cron worker)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Routing
APP_URL=http://localhost:5173

# Email Configuration (Nodemailer Beta)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Email Configuration (Brevo Production - Currently Commented Out)
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=your_verified_sender_email
```

Start the scheduling engine:

```bash
node index.js
```

-----

## 🌐 Deployment Notes

Scholaco is designed to be deployed across two distinct platforms to maximize free-tier cloud architecture:

1.  **The Client (Vercel):** The root folder is deployed directly to Vercel. Only the `VITE_` prefixed variables are exposed to the build environment.
2.  **The Worker (Render):** The `api/` folder is deployed as a Web Service on Render.
      * *Keep-Alive Strategy:* Because Render's free tier sleeps after 15 minutes of inactivity, the Express server exposes a `/ping` route. A free UptimeRobot monitor pings this route every 5 minutes to ensure the cron scheduler never misses a minute.

-----

## 🔒 Security Posture

  * **Database:** No data can be accessed without a valid JWT. The `applications` table enforces strict RLS policies matching `auth.uid() = user_id`.
  * **Environment Isolation:** The `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to the Node backend environment and is never compiled into the client-side bundle.
  * **Input Sanitization:** All user-generated text rendered on the dashboard passes through an HTML escape function to prevent Cross-Site Scripting (XSS).

-----

## 👨‍💻 Author

**Alex Marvellous** \* **X (Twitter):** [@Alexa\_The\_Dev](https://www.google.com/search?q=https://twitter.com/Alexa_The_Dev)

  * **Email:** marvellousalex1@gmail.com

**Giwa Fatimoh** 
* **Email:** fatimoh.giwa.w@gmail.com
* **X(Twitter)**:@The\_Nexra
