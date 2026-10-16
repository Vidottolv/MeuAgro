import { createClient } from '@supabase/supabase-js';
import { cachedFetch, isOnline } from '../offline/runtime.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();

const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function validateSupabaseEnvironment() {
  const errors = [];

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL não foi definida.');
  }

  if (!supabasePublishableKey) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY não foi definida.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const supabaseEnvironment = validateSupabaseEnvironment();

if (!supabaseEnvironment.isValid) {
  console.error('Configuração do Supabase inválida:', supabaseEnvironment.errors);
}

const onlineClient = supabaseEnvironment.isValid
  ? createClient(supabaseUrl, supabasePublishableKey, {
      global: { fetch: cachedFetch },
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: isOnline(),
        persistSession: true,
        // Callback service owns URL consumption before the router starts.
        detectSessionInUrl: false,
      },
    })
  : null;

// Offline reads must not wait for an expired JWT to refresh over the network.
// This client only reaches the scoped local GET cache; it cannot authorize server writes.
const localReadClient = supabaseEnvironment.isValid
  ? createClient(supabaseUrl, supabasePublishableKey, {
      accessToken: async () => null,
      global: { fetch: cachedFetch },
    })
  : null;
export const supabase = onlineClient
  ? new Proxy(onlineClient, {
      get(target, property) {
        if (property === 'from')
          return (...args) => (isOnline() ? target : localReadClient).from(...args);
        const value = Reflect.get(target, property);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    })
  : null;
