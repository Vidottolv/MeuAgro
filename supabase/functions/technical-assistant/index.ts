import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import { createAssistantHandler } from './handler.js';
const key = (legacy: string, modern: string) =>
  Deno.env.get(legacy) || JSON.parse(Deno.env.get(modern) || '{}').default;
Deno.serve(
  createAssistantHandler({
    env: (k: string) => Deno.env.get(k),
    userClient: (authorization: string) =>
      createClient(
        Deno.env.get('SUPABASE_URL')!,
        key('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS'),
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: authorization } },
        },
      ),
    adminClient: () =>
      createClient(
        Deno.env.get('SUPABASE_URL')!,
        key('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS'),
        { auth: { persistSession: false, autoRefreshToken: false } },
      ),
  }),
);
