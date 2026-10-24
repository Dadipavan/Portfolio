import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  Caveat,
  Fraunces,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Newsreader,
  Outfit,
  Space_Grotesk,
} from 'next/font/google';
import './globals.css';
import './looks.css';
import { getSiteUrl } from '@/lib/site';
import { getPublicPortfolio } from '@/lib/server/portfolio';
import { makeTranslate } from '@/lib/copy';
import { LAYOUTS } from '@/lib/siteSettings';
import { themeInitScript } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// The data-style font used for numbers and small labels
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// Lettering of the newer looks. Next.js reads these settings while building, so each one is written out in full
// (a shared object with "..." is not allowed). They are not preloaded: a visitor's browser only downloads the
// font that the chosen look actually uses.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-fraunces',
});
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-newsreader',
});
const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-baskerville',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-space-grotesk',
});
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-outfit',
});
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-bricolage',
});
const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-lora',
});
const caveat = Caveat({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-caveat',
});

const fontVariables = [
  inter,
  mono,
  fraunces,
  newsreader,
  baskerville,
  spaceGrotesk,
  outfit,
  bricolage,
  lora,
  caveat,
]
  .map((font) => font.variable)
  .join(' ');

export async function generateMetadata(): Promise<Metadata> {
  const { personalInfo, siteSettings } = await getPublicPortfolio();
  const t = makeTranslate(siteSettings.copy);
  const vars = { name: personalInfo.name, shortName: personalInfo.shortName, title: personalInfo.title };
  const title = t('seo.title', vars);
  const description = t('seo.description', vars);
  const keywords = [
    ...t('seo.keywords')
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean),
    personalInfo.name,
  ];

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s | ${personalInfo.shortName}` },
    description,
    keywords,
    authors: [{ name: personalInfo.name }],
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/',
      siteName: t('seo.siteName', vars),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1020' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteSettings } = await getPublicPortfolio();
  const { appearance } = siteSettings;
  const layoutTheme = LAYOUTS.find((l) => l.id === appearance.layout)?.defaultTheme ?? 'light';

  // Sets the theme, look, accent and motion before the first paint so nothing flashes
  const initScript = themeInitScript({
    mode: appearance.theme,
    layoutTheme,
    allowVisitor: appearance.allowVisitorTheme,
    layout: appearance.layout,
    accent: appearance.accent,
    animations: appearance.animations,
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className={`${fontVariables} font-sans antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
