import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName } = body
    if (!fileName) {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 })
    }

    const bucketName = 'certificates'
    const { error } = await supabaseAdmin.storage.from(bucketName).remove([fileName])

    if (error) {
      console.error('Failed to delete file from storage:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete route error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Delete failed' }, { status: 500 })
  }
}
