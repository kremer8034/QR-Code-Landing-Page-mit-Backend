import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service-role key.
 * All database access in this app happens on the server; the browser never
 * receives a Supabase key. RLS is enabled on every table with no policies, so
 * only this service-role client (which bypasses RLS) can read or write.
 */

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase ist nicht konfiguriert. Bitte SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY als Umgebungsvariablen setzen.',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabasePublicUrl(bucket: string, path: string): string {
  const base = process.env.SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
