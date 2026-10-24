import { ImageResponse } from 'next/og';
import { makeTranslate } from '@/lib/copy';
import { getPublicPortfolio } from '@/lib/server/portfolio';
import { ACCENTS } from '@/lib/siteSettings';

export const alt = 'Portfolio preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Regenerate hourly so a changed name, title or accent colour shows up in link previews
export const revalidate = 3600;

export default async function OpengraphImage() {
  const { personalInfo, siteSettings } = await getPublicPortfolio();
  const t = makeTranslate(siteSettings.copy);
  const accent = ACCENTS.find((a) => a.id === siteSettings.appearance.accent)?.swatch ?? '#1d4ed8';
  // the line under the name: the admin's own text, or the names of the roles
  const tagline =
    t('og.tagline').trim() ||
    siteSettings.roles.map((role) => role.label).join(' · ') ||
    personalInfo.title;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: '#ffffff',
          color: '#0f172a',
          borderLeft: `16px solid ${accent}`,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 4, color: accent, fontWeight: 700 }}>
          {t('og.label')}
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>
          {personalInfo.shortName}
        </div>
        <div style={{ fontSize: 36, color: '#475569', marginTop: 28, lineHeight: 1.3 }}>
          {tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
