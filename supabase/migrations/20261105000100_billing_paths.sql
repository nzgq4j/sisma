-- Billing paths: Google Play subscriptions and Stripe subscriptions made outside the app's checkout.
-- Additive only.

-- Google Play: purchases carry an obfuscated account id (sha-256 of the user id, never the id itself), so a Real-time
-- Developer Notification for a purchase the app has not reported yet can still be matched to its account.
alter table public.profiles
  add column play_account_id text generated always as (encode(sha256(convert_to(id::text, 'UTF8')), 'hex')) stored;
create index profiles_play_account_idx on public.profiles (play_account_id);
create index profiles_play_token_idx on public.profiles (play_purchase_token) where play_purchase_token is not null;
create index profiles_stripe_customer_idx on public.profiles (stripe_customer_id) where stripe_customer_id is not null;

-- Stripe: a subscription without our userId metadata (e.g. created in the Stripe dashboard) is matched by the
-- customer's email address. Service role only.
create or replace function public.user_id_for_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
$$;
revoke execute on function public.user_id_for_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_email(text) to service_role;

-- Which store the current subscription comes from, so an ending subscription in one store does not switch off a
-- running one in the other (written by the Stripe webhook and the Google Play routes only).
alter table public.profiles add column billing_source text check (billing_source in ('stripe', 'play'));
grant select (billing_source, play_account_id) on public.profiles to authenticated;
