import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

// Upload certificate file to 'certificates' bucket
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as any

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const originalName = file.name || `upload_${Date.now()}`
    const ext = originalName.split('.').pop() || ''
    const base = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
    const uniqueName = `${base}_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`

    // Ensure bucket exists and upload
    const bucketName = 'certificates'

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(uniqueName, file as any)

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(uniqueName)

    return NextResponse.json({ success: true, fileName: uniqueName, publicUrl: urlData.publicUrl })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 })
  }
}
