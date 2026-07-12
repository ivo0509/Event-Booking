import { supabase } from './supabase.js';

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, updated_at')
    .order('email', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUser({ email, password, fullName, role }) {
  const { data, error } = await supabase.functions.invoke('admin-user-manager', {
    body: { action: 'create', email, password, fullName, role },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data.user;
}

export async function updateUser(id, { fullName, role }) {
  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      role,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteUser(id) {
  const { error } = await supabase.rpc('admin_delete_user', {
    target_user_id: id,
  });

  if (error) throw error;
}
