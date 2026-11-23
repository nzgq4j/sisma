-- Complimentary sisma+ for life, granted by an administrator (e.g. to family, testers or partners). Billing never
-- changes it: Stripe and Google Play keep writing plan / subscription_status as before, and effective_plan() gives
-- sisma+ whatever they say. Not writable by users (profiles only grants UPDATE on display_name, locale, theme and
-- tsunami_push to authenticated; there is no INSERT policy).
alter table public.profiles add column complimentary boolean not null default false;
comment on column public.profiles.complimentary is 'sisma+ for life, set by an administrator; billing never changes it';

create or replace function public.effective_plan(p public.profiles)
returns text language sql stable set search_path = '' as $$
  select case
    when p.complimentary then 'plus'
    when p.plan is distinct from 'plus' then 'free'
    when p.subscription_status in ('trialing','active','past_due') then 'plus'
    when p.trial_ends_at is not null and p.trial_ends_at > now() then 'plus'
    else 'free' end;
$$;
