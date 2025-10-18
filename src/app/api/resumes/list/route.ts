import { NextResponse } from 'next/server'
import { supabaseAdmin, RESUME_BUCKET_SERVER } from '@/lib/supabaseServer'

export async function GET() {
  try {
    console.log('🔍 API /resumes/list called')
    console.log('🔑 Using bucket:', RESUME_BUCKET_SERVER)
    
    // First, check if bucket exists
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError)
      return NextResponse.json({ 
        success: false, 
        error: `Cannot access storage buckets: ${bucketError.message}` 
      }, { status: 500 })
    }
    
    const bucketExists = buckets?.some(b => b.name === RESUME_BUCKET_SERVER)
    if (!bucketExists) {
      console.error('❌ Bucket does not exist:', RESUME_BUCKET_SERVER)
      console.log('Available buckets:', buckets?.map(b => b.name))
      return NextResponse.json({ 
        success: false, 
        error: `Bucket '${RESUME_BUCKET_SERVER}' does not exist` 
      }, { status: 404 })
    }
    
    console.log('✅ Bucket exists, listing files...')
    
    const { data, error } = await supabaseAdmin.storage.from(RESUME_BUCKET_SERVER).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

    if (error) {
      console.error('❌ Supabase list error:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to list files: ${error.message}` 
      }, { status: 500 })
    }

    console.log('✅ Raw files found:', data?.length || 0)
    console.log('📂 Files:', data?.map(f => f.name))
    
    // Filter out directories and system files
    const files = (data || [])
      .filter(f => f.name && !f.name.endsWith('/') && !f.name.startsWith('.'))
      .map((f: any) => {
        const { data: urlData } = supabaseAdmin.storage.from(RESUME_BUCKET_SERVER).getPublicUrl(f.name)
        return {
          name: f.name,
          id: f.id || f.name,
          size: f.metadata?.size || 0,
          mimeType: f.metadata?.mimetype || 'application/octet-stream',
          createdAt: f.created_at || f.updated_at || new Date().toISOString(),
          publicUrl: urlData.publicUrl
        }
      })

    console.log('📄 Processed files:', files.length)
    console.log('📋 File names:', files.map(f => f.name))
    
    return NextResponse.json({ 
      success: true, 
      files,
      total: files.length,
      bucket: RESUME_BUCKET_SERVER
    })
  } catch (err) {
    console.error('💥 List resumes failed:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to list files',
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined
    }, { status: 500 })
  }
}
