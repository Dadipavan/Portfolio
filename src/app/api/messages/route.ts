import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

// List contact messages (admin only)
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .select('id, name, email, subject, message, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Load messages failed:', error.code, error.message);
    const missing = error.code && MISSING_TABLE_CODES.has(error.code);
    return NextResponse.json(
      {
        success: false,
        setupRequired: Boolean(missing),
        error: missing
          ? 'The contact_messages table does not exist yet'
          : 'Failed to load messages',
      },
      { status: missing ? 503 : 500 }
    );
  }

  return NextResponse.json({ success: true, messages: data });
}

// Mark a message read or unread (admin only)
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { id, isRead } = await request.json().catch(() => ({}));
  if (typeof id !== 'string' || !UUID.test(id) || typeof isRead !== 'boolean') {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('contact_messages')
    .update({ is_read: isRead })
    .eq('id', id);
  if (error) {
    console.error('Update message failed:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}

// Delete a message (admin only)
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('id');
  if (!id || !UUID.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('contact_messages').delete().eq('id', id);
  if (error) {
    console.error('Delete message failed:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
