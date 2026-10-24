-- Security hardening for an EXISTING Supabase project (safe to run more than once).
-- Run in: Supabase Dashboard > SQL Editor > New query. Run each step on its own.
--
-- What it does:
--   * removes any policy that lets the public (anon) key read or write portfolio_data / resumes tables
--   * removes any storage.objects policy that lets the public key list, upload or delete files
--     in the `resumes` and `certificates` buckets
-- What it does NOT touch: your data, your files, or the bucket settings. Public buckets keep serving
-- files by URL (that does not depend on these policies). The app uses the service-role key, which
-- bypasses Row Level Security, so the site and admin panel keep working.

-- STEP 1 (read-only): review the policies that exist today.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('portfolio_data', 'resumes'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- STEP 2: make sure Row Level Security is on for both tables (no-op if already enabled; skips a table that does not exist).
do $$
begin
  if to_regclass('public.portfolio_data') is not null then
    execute 'alter table public.portfolio_data enable row level security';
  end if;
  if to_regclass('public.resumes') is not null then
    execute 'alter table public.resumes enable row level security';
  end if;
end $$;

-- STEP 3: drop policies that give the public key access to the tables.
-- Keeps the service-role policies created by database/init.sql.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('portfolio_data', 'resumes')
      and policyname not like '%service role%'
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
    raise notice 'dropped policy % on %', p.policyname, p.tablename;
  end loop;
end $$;

-- STEP 4: drop storage policies that mention the resumes or certificates buckets.
-- If Supabase answers "must be owner of table objects", do this step in the dashboard instead:
-- Storage > Policies, then delete every policy listed for the "resumes" and "certificates" buckets.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%resumes%' or coalesce(with_check, '') ilike '%resumes%'
        or coalesce(qual, '') ilike '%certificates%' or coalesce(with_check, '') ilike '%certificates%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
    raise notice 'dropped storage policy %', p.policyname;
  end loop;
end $$;

-- STEP 5 (read-only): confirm. portfolio_data and resumes should list only the service-role policies,
-- and no storage.objects policy should mention resumes or certificates.
select schemaname, tablename, policyname, cmd from pg_policies
where (schemaname = 'public' and tablename in ('portfolio_data', 'resumes'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- STEP 6: confirm in the app. Admin > Dashboard > System check > "Run again":
-- both "Visitors cannot ..." lines should turn green.

-- ROLLBACK (only if something stops working): recreate the old public read access.
--   create policy "Enable read access for all users" on public.portfolio_data for select using (true);
-- (Do not recreate public insert/delete policies on storage.objects.)
