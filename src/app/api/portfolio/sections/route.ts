import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    
    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section parameter is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(`🔄 Updating portfolio section: ${section}`)

    const { error } = await supabaseAdmin
      .from('portfolio_data')
      .upsert({
        section,
        data: body,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'section'
      })

    if (error) {
      console.error('❌ Database error updating section:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update portfolio section', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Section ${section} updated successfully`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('💥 Update section failed:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Update failed' 
    }, { status: 500 })
  }
}