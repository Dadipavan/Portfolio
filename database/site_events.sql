-- Visitor insights (Admin > Insights). Safe to run more than once; does not touch any existing table.
-- Run in: Supabase Dashboard > SQL Editor > New query.
--
-- It stores only an event name (for example "project_open"), a short target (the project title), the
-- role the visitor chose and the look in use. No cookies, no IP address, no identifiers.
-- Row Level Security is enabled with NO policies, so only the server (service-role key) can read or write it.

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null,
  target text not null default '',
  role text not null default '',
  layout text not null default ''
);

alter table public.site_events enable row level security;

create index if not exists idx_site_events_created_at on public.site_events (created_at desc);
create index if not exists idx_site_events_event on public.site_events (event, created_at desc);

-- Optional housekeeping: remove events older than 13 months (run now and then if you like)
-- delete from public.site_events where created_at < now() - interval '13 months';

-- Verify (expected: one row, rls_enabled = true):
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid = 'public.site_events'::regclass;
