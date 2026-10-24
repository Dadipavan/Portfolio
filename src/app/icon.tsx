import { ImageResponse } from 'next/og';
import { getPublicPortfolio } from '@/lib/server/portfolio';
import { ACCENTS } from '@/lib/siteSettings';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Regenerate hourly so a changed name or accent colour shows up in the browser tab
export const revalidate = 3600;

// The initials of the short name on the accent colour (for example "SP" for "Sai Pavan")
export default async function Icon() {
  const { personalInfo, siteSettings } = await getPublicPortfolio();
  const accent = ACCENTS.find((a) => a.id === siteSettings.appearance.accent)?.swatch ?? '#1d4ed8';
  const initials =
    personalInfo.shortName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'P';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: accent,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        {initials}
      </div>
    ),
    {
      ...size,
    }
  );
}
