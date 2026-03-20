/**
 * Supabase Client
 * Connects to your Supabase project
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Get from your .env file or Supabase dashboard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with proper configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});

// Auth helpers
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  
  if (error) {
    showToast('Failed to update application', 'error');
  } else {
    showToast('Application updated successfully!');
    closeModal('edit-application');
    await loadApplications();
    
    // Send email if status changed to awaiting
    if (updates.status === 'awaiting' && currentUser) {
      await sendApplicationSubmitted(currentUser.email, updates.name);
    }
  }
  
  btn.disabled = false;
  btn.textContent = 'Save Changes';
}

// Confirm and delete application
export function confirmDelete(id) {
  const btn = document.querySelector(`[data-id="${id}"] .delete-btn`);
  if (btn.dataset.confirming) {
    handleDelete(id);
  } else {
    btn.dataset.confirming = 'true';
    btn.innerHTML = `<span class="text-xs font-semibold text-red-600">Confirm?</span>`;
    btn.classList.add('w-20');
    setTimeout(() => {
      if (btn.dataset.confirming) {
        btn.dataset.confirming = '';
        btn.classList.remove('w-20');
        btn.innerHTML = `<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
      }
    }, 3000);
  }
}

async function handleDelete(id) {
  const { error } = await deleteApplication(id);
  
  if (error) {
    showToast('Failed to delete application', 'error');
  } else {
    showToast('Application deleted');
    await loadApplications();
  }
}

// Clear reminder
export async function clearReminder(id) {
  const { error } = await updateApplication(id, { reminder: null });
  
  if (error) {
    showToast('Failed to clear reminder', 'error');
  } else {
    showToast('Reminder dismissed');
    await loadApplications();
  }
}

// Form handlers for auth
export async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  const { error } = await signIn(email, password);
  
  if (error) {
    showToast(error.message, 'error');
  } else {
    showToast('Welcome back!');
    showPage('dashboard-page');
  }
}

export async function handleSignup(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('signup-first').value;
  const lastName = document.getElementById('signup-last').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  const fullName = `${firstName} ${lastName}`;
  
  const { error } = await signUp(email, password, fullName);
  
  if (error) {
    showToast(error.message, 'error');
  } else {
    showToast('Account created successfully!');
    await sendWelcomeEmail(email, fullName);
    showPage('dashboard-page');
  }
}

export async function signOut() {
  return await supabase.auth.signOut();
}
