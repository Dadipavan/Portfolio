import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';
import { isAdminRequest, requireAdmin } from '@/lib/server/session';
import { toPublicResumes } from '@/lib/server/portfolio';
import {
  PORTFOLIO_SECTIONS,
  PORTFOLIO_TABLE,
  isPortfolioSection,
  isValidSectionPayload,
} from '@/lib/server/sections';

export async function GET(request: NextRequest) {
  try {
    const { data: portfolioSections, error } = await supabaseAdmin
      .from(PORTFOLIO_TABLE)
      .select('section, data, updated_at')
      .order('section');

    if (error) {
      console.error('Database error fetching portfolio data:', error.message);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch portfolio data' },
        { status: 500 }
      );
    }

    if (!portfolioSections || portfolioSections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No portfolio data found' },
        { status: 404 }
      );
    }

    const isAdmin = isAdminRequest(request);
    const portfolioData: Record<string, unknown> = { resumes: [] };

    portfolioSections.forEach((section) => {
      if (section.section === 'resumes') {
        const resumes = Array.isArray(section.data) ? section.data : [];
        portfolioData.resumes = isAdmin ? resumes : toPublicResumes(resumes);
      } else {
        portfolioData[section.section] = section.data;
      }
    });

    portfolioData.lastUpdated = portfolioSections.reduce(
      (latest, section) =>
        new Date(section.updated_at).getTime() > new Date(latest).getTime()
          ? section.updated_at
          : latest,
      portfolioSections[0].updated_at
    );

    return NextResponse.json(
      { success: true, data: portfolioData },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    console.error('Get portfolio data failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { data, section } = body ?? {};

    // Update one section
    if (section !== undefined) {
      if (!isPortfolioSection(section) || !isValidSectionPayload(data)) {
        return NextResponse.json(
          { success: false, error: 'Invalid section or data' },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from(PORTFOLIO_TABLE)
        .upsert({ section, data, updated_at: new Date().toISOString() }, { onConflict: 'section' });

      if (error) {
        console.error('Database error updating section:', error.message);
        return NextResponse.json(
          { success: false, error: 'Failed to update portfolio section' },
          { status: 500 }
        );
      }
      revalidatePath('/');
      return NextResponse.json({ success: true });
    }

    // Update several sections at once (resumes are managed only by the resume routes)
    if (data === null || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 });
    }

    const updates = PORTFOLIO_SECTIONS.filter(
      (name) => name !== 'resumes' && data[name] !== undefined
    )
      .filter((name) => isValidSectionPayload(data[name]))
      .map((name) => ({ section: name, data: data[name], updated_at: new Date().toISOString() }));

    if (updates.length > 0) {
      const { error } = await supabaseAdmin
        .from(PORTFOLIO_TABLE)
        .upsert(updates, { onConflict: 'section' });

      if (error) {
        console.error('Database error updating portfolio data:', error.message);
        return NextResponse.json(
          { success: false, error: 'Failed to update portfolio data' },
          { status: 500 }
        );
      }
    }

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save portfolio data failed:', err);
    return NextResponse.json({ success: false, error: 'Save failed' }, { status: 500 });
  }
}
