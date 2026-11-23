-- X posting was not adopted (PR #91 closed): remove what 20261109133220_x_posts.sql added. All tables were empty and no
-- x_session secret was ever stored. (Applied to the project directly; recorded here so the local history matches.)
drop function if exists public.x_session_get();
drop function if exists public.x_session_set(jsonb);
drop table if exists public.x_oauth_states;
drop table if exists public.x_posts;
drop table if exists public.x_settings;
