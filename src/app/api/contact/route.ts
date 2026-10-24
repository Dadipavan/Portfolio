import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { createRateLimiter, getClientKey, isSameOrigin } from '@/lib/server/rateLimit';

// 5 messages per visitor per hour
const limiter = createRateLimiter(5, 60 * 60 * 1000);

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name').max(100, 'Name is too long'),
  email: z.email('Please enter a valid email address').max(200, 'Email is too long'),
  subject: z.string().max(150, 'Subject is too long'),
  message: z
    .string()
    .min(10, 'Please write at least 10 characters')
    .max(3000, 'Message is too long (3000 characters maximum)'),
});

// Postgres "undefined table" and PostgREST "table not in schema cache"
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const clientKey = getClientKey(request);
  if (limiter.isLimited(clientKey)) {
    return NextResponse.json(
      { success: false, error: 'You have sent several messages recently. Please try again later.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  // Honeypot: real visitors never fill this field. Pretend success so bots learn nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  const trimmed = Object.fromEntries(
    ['name', 'email', 'subject', 'message'].map((key) => [key, String(body[key] ?? '').trim()])
  );
  const parsed = contactSchema.safeParse(trimmed);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    });
    return NextResponse.json(
      { success: false, error: 'Please check the highlighted fields.', fieldErrors },
      { status: 400 }
    );
  }

  limiter.record(clientKey);

  const { error } = await supabaseAdmin.from('contact_messages').insert(parsed.data);
  if (error) {
    console.error('Contact message insert failed:', error.code, error.message);
    const unavailable = error.code && MISSING_TABLE_CODES.has(error.code);
    return NextResponse.json(
      {
        success: false,
        error: unavailable
          ? 'The contact form is temporarily unavailable. Please use the email address on this page.'
          : 'Your message could not be sent. Please try again later.',
      },
      { status: unavailable ? 503 : 500 }
    );
  }

  return NextResponse.json({ success: true });
}
