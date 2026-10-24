import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

// Public: the time of the latest content change. Open pages poll this to know when to refresh themselves.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('portfolio_data')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);
    return NextResponse.json(
      { version: data?.[0]?.updated_at ?? '' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { version: '' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
