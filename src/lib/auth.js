import { supabase } from './supabase.js';
import { navigate } from '../router/router.js';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isAdmin() {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  navigate('/');
}

export function initAuthState() {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    const profile = session ? await getCurrentUserProfile().catch(() => null) : null;
    window.dispatchEvent(new CustomEvent('authchange', { detail: { session, profile } }));
  });

  return supabase.auth.onAuthStateChange(async (_event, session) => {
    const profile = session ? await getCurrentUserProfile().catch(() => null) : null;
    window.dispatchEvent(new CustomEvent('authchange', { detail: { session, profile } }));
  });
}
