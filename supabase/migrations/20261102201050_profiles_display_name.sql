-- Display names are edited by users from Me → Account: 1–50 visible characters, no surrounding spaces, or null.
alter table public.profiles
  add constraint profiles_display_name_len
  check (display_name is null or (char_length(display_name) between 1 and 50 and display_name = btrim(display_name)));
