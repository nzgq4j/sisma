-- Saved locations for place search: a secondary line (region, country), bounded text, signed-in users only,
-- one default ("primary") place per user, and a race-free plan limit.

alter table public.saved_locations
  add column detail text,
  add constraint saved_locations_name_len check (char_length(name) between 1 and 120),
  add constraint saved_locations_detail_len check (detail is null or char_length(detail) <= 160);

-- At most one default place per user (the one the app opens on).
create unique index saved_locations_one_primary on public.saved_locations (user_id) where is_primary;

-- Only signed-in users have rows; guests keep their places on the device.
revoke all on public.saved_locations from anon;
drop policy "own locations" on public.saved_locations;
create policy "own locations select" on public.saved_locations for select to authenticated using (user_id = (select auth.uid()));
create policy "own locations insert" on public.saved_locations for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own locations update" on public.saved_locations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own locations delete" on public.saved_locations for delete to authenticated using (user_id = (select auth.uid()));

-- Serialise inserts per user so two at once can't both pass the count (free: 1, sisma+: 10).
create or replace function public.enforce_location_limit() returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.profiles; n int; cap int;
begin
  perform pg_advisory_xact_lock(hashtextextended('saved_locations:' || new.user_id::text, 0));
  select * into p from public.profiles where id = new.user_id;
  cap := case public.effective_plan(p) when 'plus' then 10 else 1 end;
  select count(*) into n from public.saved_locations where user_id = new.user_id;
  if n >= cap then raise exception 'Location limit reached (%)', cap using errcode = 'P0001'; end if;
  return new;
end; $$;
revoke execute on function public.enforce_location_limit() from public, anon, authenticated;
