-- Bluesky sign-in from Me → Administration. The password is only used once to sign in and is never stored; the
-- resulting session (access and refresh tokens, renewed by the server) is kept encrypted in Supabase Vault under the
-- name 'bluesky_session'. Only the service role can read or change it (security definer functions below). Additive.

alter table public.bluesky_settings
  add column account_handle text,
  add column account_did text,
  add column connected_at timestamptz,
  add column connected_by uuid references public.profiles on delete set null,
  add column last_error text;

create or replace function public.bluesky_session_get() returns jsonb
language sql stable security definer set search_path = '' as $$
  select decrypted_secret::jsonb from vault.decrypted_secrets where name = 'bluesky_session' limit 1;
$$;

create or replace function public.bluesky_session_set(p_session jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  select id into sid from vault.secrets where name = 'bluesky_session' limit 1;
  if p_session is null then
    if sid is not null then delete from vault.secrets where id = sid; end if;
  elsif sid is null then
    perform vault.create_secret(p_session::text, 'bluesky_session', 'Bluesky session for sisma automatic posts (tokens only, no password)');
  else
    perform vault.update_secret(sid, p_session::text);
  end if;
end; $$;

revoke execute on function public.bluesky_session_get() from public, anon, authenticated;
revoke execute on function public.bluesky_session_set(jsonb) from public, anon, authenticated;
grant execute on function public.bluesky_session_get() to service_role;
grant execute on function public.bluesky_session_set(jsonb) to service_role;
