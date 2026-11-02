-- Cover the user_id foreign keys (Supabase performance advisor: unindexed_foreign_keys).
create index felt_reports_user_idx on public.felt_reports (user_id);
create index push_tokens_user_idx on public.push_tokens (user_id);
create index saved_locations_user_idx on public.saved_locations (user_id);
