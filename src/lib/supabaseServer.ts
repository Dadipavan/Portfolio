// Server-only Supabase client using the service-role key. Never import this from client components.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseServiceKey && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  throw new Error(`Missing server Supabase environment variables: ${missing.join(', ')}`);
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const RESUME_BUCKET_SERVER = process.env.NEXT_PUBLIC_RESUME_BUCKET || 'resumes';
