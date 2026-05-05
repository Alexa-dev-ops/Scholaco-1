import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// --- ENV VARS ---
const APP_URL = process.env.APP_URL || 'https://scholaco.tech';
const SENDER_EMAIL = 'hello@scholaco.tech';

// --- RESEND SETUP ---
const resend = new Resend(process.env.RESEND_API_KEY);

// Base send function — everything goes through here
async function send(toEmail, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Scholaco <${SENDER_EMAIL}>`,
      to: toEmail,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return false;
    }

    console.log(`[Resend] Email sent to ${toEmail} (ID: ${data.id})`);
    return true;

  } catch (err) {
    console.error('[Resend Error]', err.message);
    return false;
  }
}

// --- Welcome email ---
export async function sendWelcomeEmail(toEmail, fullName) {
  const firstName = fullName.split(' ')[0];
  const subject = 'Welcome to Scholaco 🎓';
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background-color:#f5f0f0;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0f0;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#7B1C2E;padding:36px 48px;">
                <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#fff;">scholaco</span>
                <p style="margin:12px 0 0;font-size:13px;color:#f0c8c8;letter-spacing:1.5px;text-transform:uppercase;">Track Your Path to Success</p>
              </td>
            </tr>
            <tr><td style="height:4px;background:linear-gradient(90deg,#7B1C2E,#a83250,#7B1C2E);"></td></tr>
            <tr>
              <td style="padding:48px 48px 36px;">
                <h1 style="margin:0 0 16px;font-size:26px;color:#1a1a2e;">You're in, ${firstName}.</h1>
                <p style="font-family:Arial,sans-serif;font-size:15px;color:#4a4a6a;line-height:1.7;">
                  Welcome to Scholaco. Your scholarship journey just got a lot more organised —
                  track every application, never miss a deadline, and stay on top of every opportunity.
                </p>
                <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                  <tr>
                    <td style="background-color:#7B1C2E;border-radius:8px;">
                      <a href="${APP_URL}/dashboard"
                        style="display:inline-block;padding:16px 40px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                        Go to Dashboard →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-family:Arial,sans-serif;font-size:14px;color:#888;line-height:1.6;">
                  Good luck with your applications. We're rooting for you.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#1a1a2e;padding:28px 48px;text-align:center;">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6a6a9a;">
                  scholaco &nbsp;|&nbsp; This is an automated message — please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `;
  return send(toEmail, subject, html);
}

// --- Deadline reminder email ---
export async function sendDeadlineReminderEmail(toEmail, appName, organization, deadline, daysLeft) {
  const dayLabel = daysLeft === 1 ? 'day' : 'days';
  const urgencyColor = daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#d97706' : '#7B1C2E';
  const subject = `⏰ ${appName} deadline in ${daysLeft} ${dayLabel}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background-color:#f5f0f0;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0f0;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#7B1C2E;padding:36px 48px;">
                <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#fff;">scholaco</span>
                <p style="margin:12px 0 0;font-size:13px;color:#f0c8c8;letter-spacing:1.5px;text-transform:uppercase;">Deadline Reminder</p>
              </td>
            </tr>
            <tr><td style="height:4px;background:linear-gradient(90deg,#7B1C2E,#a83250,#7B1C2E);"></td></tr>
            <tr>
              <td style="padding:48px 48px 36px;">
                <h1 style="margin:0 0 8px;font-size:26px;color:#1a1a2e;">Don't miss this one.</h1>
                <p style="font-family:Arial,sans-serif;font-size:15px;color:#4a4a6a;line-height:1.7;margin:0 0 28px;">
                  You have an upcoming deadline that needs your attention.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#fdf6f7;border-left:4px solid ${urgencyColor};border-radius:0 8px 8px 0;margin-bottom:28px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#1a1a2e;">${appName}</p>
                      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:#6a6a8a;">${organization}</p>
                      <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#1a1a2e;">
                        <strong>Deadline:</strong> ${deadline}
                      </p>
                      <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:14px;color:${urgencyColor};font-weight:700;">
                        ${daysLeft} ${dayLabel} remaining
                      </p>
                    </td>
                  </tr>
                </table>
                <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                  <tr>
                    <td style="background-color:#7B1C2E;border-radius:8px;">
                      <a href="${APP_URL}/dashboard"
                        style="display:inline-block;padding:16px 40px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                        View Application →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:#1a1a2e;padding:28px 48px;text-align:center;">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6a6a9a;">
                  scholaco &nbsp;|&nbsp; This is an automated message — please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `;
  return send(toEmail, subject, html);
}

// --- Application submitted email ---
export async function sendApplicationSubmittedEmail(toEmail, appName) {
  const subject = `✅ Marked as submitted: ${appName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background-color:#f5f0f0;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0f0;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#7B1C2E;padding:36px 48px;">
                <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#fff;">scholaco</span>
              </td>
            </tr>
            <tr><td style="height:4px;background:linear-gradient(90deg,#7B1C2E,#a83250,#7B1C2E);"></td></tr>
            <tr>
              <td style="padding:48px 48px 36px;">
                <h1 style="margin:0 0 16px;font-size:26px;color:#1a1a2e;">Application submitted. ✅</h1>
                <p style="font-family:Arial,sans-serif;font-size:15px;color:#4a4a6a;line-height:1.7;">
                  You've marked <strong>${appName}</strong> as submitted. That's one more step forward.
                  We'll keep it tracked in your dashboard.
                </p>
                <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                  <tr>
                    <td style="background-color:#7B1C2E;border-radius:8px;">
                      <a href="${APP_URL}/dashboard"
                        style="display:inline-block;padding:16px 40px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                        View Dashboard →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:#1a1a2e;padding:28px 48px;text-align:center;">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6a6a9a;">
                  scholaco &nbsp;|&nbsp; This is an automated message — please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `;
  return send(toEmail, subject, html);
}

// --- Custom Reminder Email ---
export async function sendCustomReminderEmail(toEmail, appName, customNote = "Time to check on this application.") {
  const subject = `📌 Reminder: ${appName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background-color:#f5f0f0;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0f0;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#7B1C2E;padding:36px 48px;">
                <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#fff;">scholaco</span>
                <p style="margin:12px 0 0;font-size:13px;color:#f0c8c8;letter-spacing:1.5px;text-transform:uppercase;">Scheduled Reminder</p>
              </td>
            </tr>
            <tr><td style="height:4px;background:linear-gradient(90deg,#7B1C2E,#a83250,#7B1C2E);"></td></tr>
            <tr>
              <td style="padding:48px 48px 36px;">
                <h1 style="margin:0 0 16px;font-size:26px;color:#1a1a2e;">You asked us to remind you.</h1>
                <p style="font-family:Arial,sans-serif;font-size:15px;color:#4a4a6a;line-height:1.7;">
                  It's time to take action on <strong>${appName}</strong>.
                </p>
                <div style="background-color:#f9fafb;border-left:4px solid #7B1C2E;padding:16px;margin:24px 0;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#374151;font-style:italic;">
                    "${customNote}"
                  </p>
                </div>
                <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                  <tr>
                    <td style="background-color:#7B1C2E;border-radius:8px;">
                      <a href="${APP_URL}/dashboard"
                        style="display:inline-block;padding:16px 40px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                        Open Dashboard →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `;
  return send(toEmail, subject, html);
}