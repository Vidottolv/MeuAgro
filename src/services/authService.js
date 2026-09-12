import { supabase } from '../js/supabase.js';

import { getAuthRedirectUrl } from './authRedirectService.js';

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado. Verifique o arquivo .env.',
    );
  }

  return supabase;
}

export async function signUp({
  fullName,
  email,
  password,
}) {
  const client = requireSupabase();

  const { data, error } =
    await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo:
          getAuthRedirectUrl('confirmation'),
        data: {
          full_name: fullName.trim(),
        },
      },
    });

  if (error) throw error;
  return data;
}

export async function signIn({
  email,
  password,
}) {
  const client = requireSupabase();

  const { data, error } =
    await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireSupabase();

  const { error } =
    await client.auth.signOut();

  if (error) throw error;
}

export async function requestPasswordReset(
  email,
) {
  const client = requireSupabase();

  const { data, error } =
    await client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo:
          getAuthRedirectUrl('recovery'),
      },
    );

  if (error) throw error;
  return data;
}

export async function updatePassword(
  password,
) {
  const client = requireSupabase();

  const { data, error } =
    await client.auth.updateUser({
      password,
    });

  if (error) throw error;
  return data;
}

export async function getSession() {
  const client = requireSupabase();

  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const client = requireSupabase();

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) throw error;
  return user;
}

export async function getCurrentProfile() {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } =
    await client
      .from('profiles')
      .select(
        'id, full_name, phone, avatar_url, onboarding_completed, created_at, updated_at',
      )
      .eq('id', user.id)
      .maybeSingle();

  if (error) throw error;
  return data;
}

export function onAuthStateChange(
  callback,
) {
  const client = requireSupabase();

  const { data } =
    client.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      },
    );

  return () => {
    data.subscription.unsubscribe();
  };
}
