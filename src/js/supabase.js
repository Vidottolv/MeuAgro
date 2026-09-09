import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim();

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function validateSupabaseEnvironment() {
  const errors = [];

  if (!supabaseUrl) {
    errors.push(
      'VITE_SUPABASE_URL não foi definida.',
    );
  }

  if (!supabasePublishableKey) {
    errors.push(
      'VITE_SUPABASE_PUBLISHABLE_KEY não foi definida.',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const supabaseEnvironment =
  validateSupabaseEnvironment();

if (!supabaseEnvironment.isValid) {
  console.error(
    'Configuração do Supabase inválida:',
    supabaseEnvironment.errors,
  );
}

export const supabase =
  supabaseEnvironment.isValid
    ? createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
          db: {
            schema: 'public',
          },
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        },
      )
    : null;
