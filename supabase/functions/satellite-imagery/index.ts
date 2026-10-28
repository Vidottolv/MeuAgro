import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import { createSatelliteHandler } from './handler.js';
const options = { auth: { persistSession: false, autoRefreshToken: false } };
function key(legacy: string, modern: string) {
  return Deno.env.get(legacy) || JSON.parse(Deno.env.get(modern) || '{}').default;
}
Deno.serve(
  createSatelliteHandler({
    env: (key: string) => Deno.env.get(key),
    userClient: (authorization: string) =>
      createClient(
        Deno.env.get('SUPABASE_URL')!,
        key('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS'),
        {
          ...options,
          global: { headers: { Authorization: authorization } },
        },
      ),
    adminClient: () =>
      createClient(
        Deno.env.get('SUPABASE_URL')!,
        key('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS'),
        options,
      ),
  }),
);
