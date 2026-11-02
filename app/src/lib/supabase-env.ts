// Supabase settings for server code. Accepts both naming schemes:
// - our own: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// - the Vercel ↔ Supabase integration (connected with the "STORAGE" prefix): STORAGE_SUPABASE_URL +
//   STORAGE_SUPABASE_SECRET_KEY (new sb_secret_… key) or STORAGE_SUPABASE_SERVICE_ROLE_KEY (legacy JWT).
// Server-only: never import this from client components.
export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL || undefined;
}

export function supabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STORAGE_SUPABASE_SECRET_KEY || process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || undefined;
}

/** URL + service key when both are configured (otherwise the API runs in demo mode). */
export function supabaseAdminConfig(): { url: string; key: string } | null {
  const url = supabaseUrl(), key = supabaseServiceKey();
  return url && key ? { url, key } : null;
}
