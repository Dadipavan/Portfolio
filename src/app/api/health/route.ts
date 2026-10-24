import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, RESUME_BUCKET_SERVER } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';
import { PORTFOLIO_TABLE } from '@/lib/server/sections';

type Status = 'ok' | 'warn' | 'error' | 'info';
interface Check {
  id: string;
  label: string;
  status: Status;
  message: string;
}

const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

// Admin only: verifies the Supabase setup, including that visitors cannot use the public key to
// read tables or list files. Read-only; it never writes anything.
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const checks: Check[] = [];
  const add = (id: string, label: string, status: Status, message: string) =>
    checks.push({ id, label, status, message });

  // 1. Database and content
  const { data: sections, error: dbError } = await supabaseAdmin
    .from(PORTFOLIO_TABLE)
    .select('section, data');
  if (dbError) {
    add(
      'database',
      'Database',
      'error',
      `Cannot read the portfolio_data table: ${dbError.message}. Run database/init.sql in the Supabase SQL Editor.`
    );
  } else {
    const names = new Set((sections ?? []).map((row) => row.section));
    add('database', 'Database', 'ok', `Connected. ${names.size} content sections found.`);

    const resumes = (sections ?? []).find((row) => row.section === 'resumes')?.data;
    const publicCount = Array.isArray(resumes)
      ? resumes.filter((r: { isPublic?: boolean }) => r && r.isPublic === true).length
      : 0;
    add(
      'public-resume',
      'Public resume',
      publicCount > 0 ? 'ok' : 'info',
      publicCount > 0
        ? 'A resume is marked Public, so visitors see the Download button.'
        : 'No resume is marked Public, so the Download button is hidden. Mark one in Admin > Resumes.'
    );
  }

  // 2. Storage buckets
  const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
  if (bucketError) {
    add('buckets', 'Storage', 'error', `Cannot reach Supabase Storage: ${bucketError.message}`);
  } else {
    const found = new Map((buckets ?? []).map((b) => [b.name, b]));
    const resumeBucket = found.get(RESUME_BUCKET_SERVER);
    add(
      'resume-bucket',
      `Bucket "${RESUME_BUCKET_SERVER}"`,
      resumeBucket ? (resumeBucket.public ? 'ok' : 'warn') : 'error',
      resumeBucket
        ? resumeBucket.public
          ? 'Exists and is public, so the Download button works.'
          : 'Exists but is not public, so resume download links will not open for visitors. Switch it to Public in Supabase Storage.'
        : `Missing. Create a public bucket named "${RESUME_BUCKET_SERVER}" in Supabase Storage.`
    );
    const certificateBucket = found.get('certificates');
    add(
      'certificate-bucket',
      'Bucket "certificates"',
      certificateBucket ? 'ok' : 'warn',
      certificateBucket
        ? 'Exists.'
        : 'Missing. Only needed for certificate images: create a public bucket named "certificates".'
    );
  }

  // 3. Contact form storage
  // A normal read (not HEAD): only a response body carries the error code that tells "missing table" apart
  const { error: contactError } = await supabaseAdmin
    .from('contact_messages')
    .select('id')
    .limit(1);
  if (!contactError) {
    add('contact', 'Contact form storage', 'ok', 'The contact_messages table exists.');
  } else if (contactError.code && MISSING_TABLE_CODES.has(contactError.code)) {
    add(
      'contact',
      'Contact form storage',
      'warn',
      'Missing. Run database/contact_messages.sql so the contact form can save messages.'
    );
  } else {
    add('contact', 'Contact form storage', 'error', `Could not check: ${contactError.message}`);
  }

  // Visitor insights storage
  const { error: eventsError } = await supabaseAdmin.from('site_events').select('id').limit(1);
  if (!eventsError) {
    add('insights', 'Visitor insights storage', 'ok', 'The site_events table exists.');
  } else if (eventsError.code && MISSING_TABLE_CODES.has(eventsError.code)) {
    add(
      'insights',
      'Visitor insights storage',
      'warn',
      'Missing. Run database/site_events.sql to see visits and clicks in Admin > Insights.'
    );
  } else {
    add('insights', 'Visitor insights storage', 'error', `Could not check: ${eventsError.message}`);
  }

  // 4. What can a visitor do with the public key? (read-only probes)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    add(
      'public-access',
      'Public access',
      'info',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set, so the public-access test was skipped.'
    );
  } else {
    const visitor = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Reading is "blocked" when Postgres refuses outright or Row Level Security returns nothing.
    // Any other error means the probe itself failed, which must not be reported as a pass.
    const blocked = (error: { code?: string; message: string } | null) =>
      !error ||
      error.code === '42501' ||
      /permission denied|row-level security/i.test(error.message);

    const tables = await visitor.from(PORTFOLIO_TABLE).select('section').limit(1);
    if (tables.data && tables.data.length > 0) {
      add(
        'public-tables',
        'Visitors cannot read your tables',
        'warn',
        'Anyone holding the public key can read portfolio_data directly (including the private resume list). Run database/security_hardening.sql.'
      );
    } else if (blocked(tables.error)) {
      add('public-tables', 'Visitors cannot read your tables', 'ok', 'Blocked, as intended.');
    } else {
      add(
        'public-tables',
        'Visitors cannot read your tables',
        'info',
        `Could not run this test: ${tables.error?.message}`
      );
    }

    const files = await visitor.storage.from(RESUME_BUCKET_SERVER).list('', { limit: 1 });
    if (files.data && files.data.length > 0) {
      add(
        'public-listing',
        'Visitors cannot list your resume files',
        'warn',
        'Anyone holding the public key can list every file in the resume bucket. Run database/security_hardening.sql.'
      );
    } else if (!files.error) {
      add(
        'public-listing',
        'Visitors cannot list your resume files',
        'ok',
        'Blocked, as intended.'
      );
    } else {
      add(
        'public-listing',
        'Visitors cannot list your resume files',
        'info',
        `Could not run this test: ${files.error.message}`
      );
    }
  }

  // 5. Deployment settings
  add(
    'site-url',
    'Site address',
    process.env.NEXT_PUBLIC_SITE_URL ? 'ok' : 'warn',
    process.env.NEXT_PUBLIC_SITE_URL
      ? `Set to ${process.env.NEXT_PUBLIC_SITE_URL}.`
      : 'NEXT_PUBLIC_SITE_URL is not set. Set it to your final address so link previews and the sitemap use it.'
  );

  return NextResponse.json({ success: true, checks }, { headers: { 'Cache-Control': 'no-store' } });
}
