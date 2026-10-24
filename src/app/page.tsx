import { getPublicPortfolio } from '@/lib/server/portfolio';
import { getProfiles } from '@/lib/profiles';
import { getSiteUrl } from '@/lib/site';
import PortfolioProvider from '@/components/site/PortfolioProvider';
import SiteShell from '@/components/site/SiteShell';

// Rebuilt at most once a minute; saving in the admin panel refreshes it immediately.
export const revalidate = 60;

export default async function Home() {
  const content = await getPublicPortfolio();
  const siteUrl = getSiteUrl();
  const { personalInfo } = content;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personalInfo.name,
    jobTitle: personalInfo.title,
    description: personalInfo.description,
    url: siteUrl,
    email: `mailto:${personalInfo.email}`,
    address: personalInfo.location,
    sameAs: getProfiles(personalInfo).map((profile) => profile.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so stored content can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <PortfolioProvider content={content} siteUrl={siteUrl}>
        <SiteShell />
      </PortfolioProvider>
    </>
  );
}
