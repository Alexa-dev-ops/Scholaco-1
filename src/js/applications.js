/**
 * Applications Service
 * Handles all application CRUD operations with Supabase
 */
import { supabase } from './supabase.js';

const CONFIG_ERROR_MESSAGE =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart Vite.";

function missingSupabaseResult() {
  return { data: null, error: new Error(CONFIG_ERROR_MESSAGE) };
}

// Reliably returns the current user by reading from the locally stored session.
// getSession() reads from localStorage — no network round trip needed.
// getUser() can return null on page load before async session restoration completes.
async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { user: session?.user ?? null, error };
}

// Get all applications for current user
export async function getAllApplications() {
  if (!supabase) return { data: [], error: new Error(CONFIG_ERROR_MESSAGE) };

  const { user } = await getCurrentSession();
  if (!user) return { data: [], error: new Error("Not authenticated") };

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return { data, error };
}


// Create new application
export async function createApplication(appData) {
  if (!supabase) return missingSupabaseResult();

  const { user, error: sessionError } = await getCurrentSession();

  if (sessionError || !user) {
    console.error("Session error on createApplication:", sessionError);
    return { data: null, error: new Error("You must be logged in to add applications.") };
  }

  // Safely parse the standard HTML5 date string into a UTC timezone string
  let formattedReminder = null;
  if (appData.reminder) {
    try {
      const dateObj = new Date(appData.reminder);
      if (!isNaN(dateObj)) {
        formattedReminder = dateObj.toISOString();
      }
    } catch (err) {
      console.error("Date parsing failed:", err);
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([{
      user_id: user.id,
      name: appData.name,
      organization: appData.organization || null,
      amount: appData.amount || null,
      deadline: appData.deadline || null,
      status: appData.status || 'not_started',
      reminder: formattedReminder,    // Sends the perfect UTC string
      reminder_sent: false,           // Required for the cron job
      notes: appData.notes || null,
    }])
    .select()
    .single();

  return { data, error };
}

// Update existing application
export async function updateApplication(id, updates) {
  if (!supabase) return missingSupabaseResult();

  const { user, error: sessionError } = await getCurrentSession();

  if (sessionError || !user) {
    return { data: null, error: new Error("You must be logged in to edit.") };
  }

  // Apply the same safe date parsing to the edit function
  let formattedReminder = null;
  if (updates.reminder) {
    try {
      const dateObj = new Date(updates.reminder);
      if (!isNaN(dateObj)) {
        formattedReminder = dateObj.toISOString();
      }
    } catch (err) {
      console.error("Date parsing failed:", err);
    }
  }

  const updateData = {
    name: updates.name,
    organization: updates.organization || null,
    amount: updates.amount || null,
    deadline: updates.deadline || null,
    status: updates.status,
    reminder: formattedReminder,
    notes: updates.notes || null,
  };

  const { data, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Security check
    .select()
    .single();

  return { data, error };
}


// Delete application
export async function deleteApplication(id) {
  if (!supabase) return { error: new Error(CONFIG_ERROR_MESSAGE) };

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);

  return { error };
}

// Get statistics
export async function getStats() {
  const { data } = await getAllApplications();
  if (!data) return null;

  const stats = {
    total: data.length,
    inProgress: data.filter(a => a.status === 'in_progress').length,
    awaiting: data.filter(a => a.status === 'awaiting').length,
    potentialAwards: data.reduce((sum, app) => {
      const amount = parseInt(app.amount?.replace(/[^0-9]/g, '') || '0');
      return sum + amount;
    }, 0)
  };

  return stats;
}