import { NextResponse } from 'next/server'
import { supabaseAdmin, RESUME_BUCKET_SERVER } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, cloudFileName } = body || {}

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing resume id' }, { status: 400 })
    }

    // If cloud file name provided, attempt to remove from storage using server key
    if (cloudFileName) {
      const { error: removeError } = await supabaseAdmin
        .storage
        .from(RESUME_BUCKET_SERVER)
        .remove([cloudFileName])

      if (removeError) {
        console.error('❌ Failed to remove storage object:', removeError)
        // continue to attempt DB cleanup even if storage removal fails, but return error flag
      } else {
        console.log('✅ Removed storage object:', cloudFileName)
      }
    }

    // Load current resumes JSON from portfolio_data
    const { data: rowData, error: selectError } = await supabaseAdmin
      .from('portfolio_data')
      .select('data')
      .eq('section', 'resumes')
      .limit(1)
      .single()

    if (selectError) {
      console.error('❌ Failed to fetch portfolio_data resumes row:', selectError)
      return NextResponse.json({ success: false, error: selectError.message || 'Failed to fetch resumes' }, { status: 500 })
    }

    const current = (rowData?.data as any) || {}
    const currentResumes = Array.isArray(current.resumes) ? current.resumes : []
    const updatedResumes = currentResumes.filter((r: any) => r.id !== id)

    // Update the portfolio_data row
    const { error: updateError } = await supabaseAdmin
      .from('portfolio_data')
      .update({ data: { ...current, resumes: updatedResumes } })
      .eq('section', 'resumes')

    if (updateError) {
      console.error('❌ Failed to update portfolio_data resumes row:', updateError)
      return NextResponse.json({ success: false, error: updateError.message || 'Failed to update resumes' }, { status: 500 })
    }

    console.log('✅ Resume deleted from DB (and storage when provided):', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('💥 Delete resume failed:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
