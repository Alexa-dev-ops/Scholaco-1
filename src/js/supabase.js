/**
 * Supabase Client
 * Connects to your Supabase project
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

// Confirms both env vars are present — used by app.js on init
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
}

// The centralized, bulletproof sign-out function
export async function signOutUser() {
  try {
    // Attempt the server-side sign-out
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  } finally {
    // FORCE clear everything locally regardless of server response
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html'; 
  }
}