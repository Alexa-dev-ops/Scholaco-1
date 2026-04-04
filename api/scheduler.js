import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendDeadlineReminderEmail, sendCustomReminderEmail } from './emailService.js';
import dotenv from 'dotenv';
dotenv.config();

// Supabase client created inside a function so env vars are loaded first
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// Updated Reminder intervals to match your new spec
const REMINDER_DAYS = [7, 5, 3];

function getTargetDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatDeadline(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// JOB 1: DEADLINE REMINDERS (Daily Check)
// ============================================================================
async function checkDeadlines() {
  console.log(`[Scheduler] Running daily deadline check — ${new Date().toISOString()}`);
  const supabase = getSupabase();

  for (const days of REMINDER_DAYS) {
    const targetDate = getTargetDate(days);

    // Fetch applications whose deadline matches exactly
    const { data: applications, error } = await supabase
      .from('applications')
      .select('id, name, organization, deadline, user_id, profiles(email)')
      .eq('deadline', targetDate);

    if (error) {
      console.error(`[Scheduler] Error fetching applications for ${days}-day check:`, error.message);
      continue;
    }

    if (!applications || applications.length === 0) continue;

    for (const app of applications) {
      const reminderType = `${days}_day`;

      // Check if this exact reminder was already sent
      const { data: alreadySent } = await supabase
        .from('email_log')
        .select('id')
        .eq('application_id', app.id)
        .eq('reminder_type', reminderType)
        .single();

      if (alreadySent) {
        continue; // Skip silently
      }

      const userEmail = app.profiles?.email;
      if (!userEmail) {
        console.warn(`[Scheduler] No email found for app "${app.name}" — skipping`);
        continue;
      }

      const success = await sendDeadlineReminderEmail(
        userEmail,
        app.name,
        app.organization || '',
        formatDeadline(app.deadline),
        days
      );

      if (success) {
        // Log so this reminder is never sent again
        await supabase.from('email_log').insert({
          application_id: app.id,
          reminder_type: reminderType,
          sent_to: userEmail,
        });
        console.log(`[Scheduler] ✅ Sent ${days}-day deadline reminder for "${app.name}"`);
      } else {
        console.error(`[Scheduler] ❌ Failed to send ${days}-day reminder for "${app.name}"`);
      }
    }
  }
}

// ============================================================================
// JOB 2: CUSTOM REMINDERS (Minute-by-Minute Check)
// ============================================================================
async function checkCustomReminders() {
  const supabase = getSupabase();
  const nowUtc = new Date().toISOString();

  // Find apps where reminder time is passed AND hasn't been sent
  const { data: applications, error } = await supabase
    .from('applications')
    .select('id, name, reminder, notes, user_id, profiles(email)')
    .lte('reminder', nowUtc)
    .eq('reminder_sent', false)
    .not('reminder', 'is', null);

  if (error) {
    console.error('[Scheduler] Supabase Custom Reminder Error:', error.message);
    return;
  }

  if (!applications || applications.length === 0) return;

  for (const app of applications) {
    const userEmail = app.profiles?.email;

    if (!userEmail) {
      console.warn(`[Scheduler] No email found for custom reminder "${app.name}" — skipping`);
      continue;
    }

    // Using app.notes as the fallback context for the email body
    const success = await sendCustomReminderEmail(
      userEmail, 
      app.name, 
      app.notes || "Time to check on this application."
    );

    if (success) {
      // Mark as sent immediately on the applications table to prevent duplicates
      await supabase
        .from('applications')
        .update({ reminder_sent: true })
        .eq('id', app.id);
        
      console.log(`[Scheduler] ✅ Sent custom reminder for "${app.name}"`);
    } else {
      console.error(`[Scheduler] ❌ Failed to send custom reminder for "${app.name}"`);
    }
  }
}

// ============================================================================
// BOOTSTRAP
// ============================================================================
export function startScheduler() {
  // 1. Deadline Check: Runs every day at 08:00 WAT (UTC+1)
  cron.schedule('0 7 * * *', checkDeadlines, {
    timezone: 'Africa/Lagos',
  });
  console.log('[Scheduler] Deadline reminder scheduler started — runs daily at 08:00 WAT');

  // 2. Custom Check: Runs every single minute
  cron.schedule('* * * * *', checkCustomReminders);
  console.log('[Scheduler] Custom minute-by-minute scheduler started');
}