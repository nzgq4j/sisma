'use client';
// Browser Supabase client (publishable key only; never the secret key). null when the project isn't configured,
// so the app runs in guest mode in local development and in previews without the env vars.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Literal references so Next inlines them at build time.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;
let providers: Promise<string[]> | undefined;

/** Social sign-in providers switched on in Supabase (Authentication → Sign In / Providers), e.g. ['google'].
 *  Read from the public /auth/v1/settings endpoint so a button only appears once its provider is configured. */
export function enabledProviders(): Promise<string[]> {
  if (!URL || !KEY) return Promise.resolve([]);
  providers ??= fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY } })
    .then(r => (r.ok ? (r.json() as Promise<{ external?: Record<string, boolean> }>) : { external: {} }))
    .then(s => Object.entries(s.external ?? {}).filter(([k, on]) => on && k !== 'email' && k !== 'phone').map(([k]) => k))
    .catch(() => { providers = undefined; return []; });
  return providers;
}
export function supabaseBrowser(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = URL && KEY ? createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'sisma.auth' } }) : null;
  return client;
}
