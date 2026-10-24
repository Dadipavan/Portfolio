import type { Metadata } from 'next';
import { getRawSections } from '@/lib/server/portfolio';
import { isAdminVisitor } from '@/lib/server/adminCookie';
import { getSiteUrl } from '@/lib/site';
import { LAYOUTS } from '@/lib/siteSettings';
import PreviewHost from '@/components/site/PreviewHost';
import type { LayoutId } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Admin only: the site as it will look, optionally in a look that is not live yet (/preview/bento).
// While developing locally it is open so it can be checked without signing in.
export default async function PreviewPage({ params }: { params: Promise<{ layout?: string[] }> }) {
  const allowed = process.env.NODE_ENV !== 'production' || (await isAdminVisitor());
  if (!allowed) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-ink text-xl font-semibold">Preview is for the admin</h1>
        <p className="text-muted mt-2">
          Sign in to the admin panel first, then open the preview from there.
        </p>
        <a href="/admin/login" className="btn-primary mt-6">
          Go to sign in
        </a>
      </main>
    );
  }

  const { layout: segments } = await params;
  const requested = segments?.[0];
  const layout = LAYOUTS.find((l) => l.id === requested)?.id as LayoutId | undefined;

  const raw = await getRawSections();
  return (
    <PreviewHost
      sections={raw?.sections ?? {}}
      version={raw?.version ?? ''}
      siteUrl={getSiteUrl()}
      layout={layout}
    />
  );
}
