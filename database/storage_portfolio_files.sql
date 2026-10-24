-- Private storage for files uploaded in the admin: the profile photo, project pictures, certificate files
-- (pictures or PDFs) and achievement files. Safe to run more than once.
-- Run in: Supabase Dashboard > SQL Editor > New query, paste all of this, then Run.
--
-- What it does:
--   * creates ONE storage bucket named "portfolio-files" and marks it PRIVATE (public = false)
--   * limits every file to 4 MB (4194304 bytes) and to JPEG, PNG, WebP and GIF pictures plus PDF documents
--     (the site checks size and the real file type itself as well; this is a second lock)
--
-- What it does NOT do:
--   * it creates and changes NO tables. The portfolio_data table, and everything you have already written in it,
--     is untouched.
--   * it does not touch the existing buckets ("resumes" and "certificates") or any file in them.
--   * it adds NO storage policies, on purpose. With no policy the public (anon) key can neither list, read, upload
--     nor delete anything in this bucket. Only the site's own server (which uses the service-role key) can, and it
--     hands a visitor a short-lived link only for a file that belongs to something you have published.
--
-- Running it again re-asserts the three settings above (private, 4 MB, allowed types). It never deletes or
-- changes a file.
--
-- If Supabase answers 'column "file_size_limit" does not exist' (a very old project), create the bucket in the
-- dashboard instead: Storage > New bucket, name portfolio-files, leave "Public bucket" OFF. See docs/NEW_FEATURES.md.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-files',
  'portfolio-files',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------------------------------
-- VERIFY (read-only). The SQL Editor shows only the result of the last statement it runs, so paste ONE of
-- these at a time into a new query, remove the leading "-- " and press Run.
-- ---------------------------------------------------------------------------------------------------

-- VERIFY 1. The bucket. Expected: one row with public = false, file_size_limit = 4194304 and the five types.
-- select id, name, public, file_size_limit, allowed_mime_types
-- from storage.buckets
-- where id = 'portfolio-files';

-- VERIFY 2. No policy names this bucket. Expected: no rows.
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
--   and (coalesce(qual, '') ilike '%portfolio-files%' or coalesce(with_check, '') ilike '%portfolio-files%');

-- VERIFY 3. Every policy on stored files (read-only). Expected: no rows, or only policies that name some OTHER
-- bucket. A policy whose "qual" or "with_check" is just "true", or that does not name a bucket at all, applies to
-- EVERY bucket, this one included: delete it in Storage > Policies (database/security_hardening.sql only removes
-- the ones that mention the "resumes" or "certificates" buckets).
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
-- order by policyname;

-- VERIFY 4. Row Level Security is on for stored files. Expected: rls_enabled = true.
-- select relname as table_name, relrowsecurity as rls_enabled
-- from pg_class
-- where oid = 'storage.objects'::regclass;

-- VERIFY 5. How many files the bucket holds. Expected: 0 on a new bucket, then it grows as you upload.
-- select count(*) as files_in_bucket
-- from storage.objects
-- where bucket_id = 'portfolio-files';

-- ---------------------------------------------------------------------------------------------------
-- OPTIONAL UNDO (leave commented unless you really want the bucket gone). This deletes NOTHING while there are
-- files in the bucket: empty it first (Storage > portfolio-files > select all > Delete), because pictures and PDFs
-- you have uploaded are lost for good once they are deleted. Then run:
-- delete from storage.buckets
-- where id = 'portfolio-files'
--   and not exists (select 1 from storage.objects where bucket_id = 'portfolio-files');
-- Recent Supabase versions refuse to delete rows of the storage tables with SQL ("Direct deletion from storage
-- tables is not allowed"). If you see that message, delete the empty bucket in the dashboard instead:
-- Storage > the bucket's menu > Delete bucket.
-- ---------------------------------------------------------------------------------------------------
