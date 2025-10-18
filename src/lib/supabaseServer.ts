import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('🔧 Server Supabase Config:')
console.log('- URL:', supabaseUrl ? `SET (${supabaseUrl})` : 'MISSING')
console.log('- Service Key:', supabaseServiceKey ? `SET (${supabaseServiceKey.substring(0, 20)}...)` : 'MISSING')
console.log('- NODE_ENV:', process.env.NODE_ENV)

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = []
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  
  console.error('❌ Missing server Supabase environment variables:', missing.join(', '))
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
  
  throw new Error(`Missing server Supabase environment variables: ${missing.join(', ')}`)
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const RESUME_BUCKET_SERVER = process.env.NEXT_PUBLIC_RESUME_BUCKET || 'resumes'

console.log('✅ Server Supabase client created for bucket:', RESUME_BUCKET_SERVER)
