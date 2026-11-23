-- Move pg_net into the extensions schema (applied to the project directly; recorded here so the local history
-- matches the database).
drop extension if exists pg_net;
create extension pg_net with schema extensions;
