import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

// Portfolio data table name
const PORTFOLIO_TABLE = 'portfolio_data'

export async function GET() {
  try {
    console.log('� Fetching portfolio data from database...')
    
    // Fetch all portfolio data sections
    const { data: portfolioSections, error } = await supabaseAdmin
      .from(PORTFOLIO_TABLE)
      .select('section, data, updated_at')
      .order('section')

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch portfolio data', details: error.message },
        { status: 500 }
      )
    }

    if (!portfolioSections || portfolioSections.length === 0) {
      console.log('⚠️ No portfolio data found in database')
      return NextResponse.json(
        { success: false, error: 'No portfolio data found' },
        { status: 404 }
      )
    }

    // Transform the data into the expected format
    const portfolioData: any = {
      resumes: [], // Initialize as empty array
      lastUpdated: new Date().toISOString()
    }

    portfolioSections.forEach(section => {
      if (section.section === 'resumes') {
        // Ensure resumes is always an array
        portfolioData[section.section] = Array.isArray(section.data) ? section.data : []
      } else {
        portfolioData[section.section] = section.data
      }
    })

    // Get the latest update timestamp
    const latestUpdate = portfolioSections.reduce((latest, section) => {
      const sectionTime = new Date(section.updated_at).getTime()
      return sectionTime > new Date(latest).getTime() ? section.updated_at : latest
    }, portfolioSections[0].updated_at)

    portfolioData.lastUpdated = latestUpdate

    console.log('✅ Portfolio data fetched successfully:', Object.keys(portfolioData))
    
    return NextResponse.json({
      success: true,
      data: portfolioData
    })
  } catch (err) {
    console.error('💥 Get portfolio data failed:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Get failed' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔄 Updating portfolio data in database...')

    if (!body.data) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      )
    }

    const { data } = body

    // If updating a specific section
    if (body.section) {
      const { section } = body
      console.log(`🔄 Updating section: ${section}`)

      const { error } = await supabaseAdmin
        .from(PORTFOLIO_TABLE)
        .upsert({
          section,
          data,
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
    }

    // If updating all data at once
    const updates = []
    const sectionsToUpdate = [
      'personalInfo',
      'technicalSkills', 
      'projects',
      'experience',
      'education',
      'certifications',
      'achievements',
      'quickFacts',
      'currentFocus'
    ]

    for (const section of sectionsToUpdate) {
      if (data[section]) {
        updates.push({
          section,
          data: data[section],
          updated_at: new Date().toISOString()
        })
      }
    }

    if (updates.length > 0) {
      const { error } = await supabaseAdmin
        .from(PORTFOLIO_TABLE)
        .upsert(updates, {
          onConflict: 'section'
        })

      if (error) {
        console.error('❌ Database error updating portfolio data:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update portfolio data', details: error.message },
          { status: 500 }
        )
      }
    }

    console.log('✅ Portfolio data updated successfully')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('💥 Save portfolio data failed:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Save failed' 
    }, { status: 500 })
  }
}