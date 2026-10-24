-- Contact form storage. Safe to run more than once; does not touch any existing table.
-- Run in: Supabase Dashboard > SQL Editor > New query.
--
-- Row Level Security is enabled with NO policies, so the public (anon) key cannot read or write
-- this table. Only the server routes, which use the service-role key, can insert and read messages.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

-- Verify (expected: one row, rls_enabled = true):
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid = 'public.contact_messages'::regclass;
