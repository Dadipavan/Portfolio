import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicPortfolio } from '@/lib/server/portfolio';
import { filterProjects, DEFAULT_FILTERS } from '@/lib/query';
import { RoleSet, resolveRoleView } from '@/lib/roles';
import { makeTranslate } from '@/lib/copy';
import { getProfiles } from '@/lib/profiles';
import PrintButton from './PrintButton';

// A clean one-page CV built from the portfolio data, so it is always up to date.
export const metadata: Metadata = {
  title: 'CV',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const content = await getPublicPortfolio();
  const { personalInfo, siteSettings } = content;
  const roles = new RoleSet(siteSettings.roles);
  const t = makeTranslate(siteSettings.copy);
  const role = roles.isRole(roleParam) ? roleParam : 'all';

  const chosen = roles.get(role);
  const roleView = resolveRoleView(role, roles);
  const projects = filterProjects(content.projects, { ...DEFAULT_FILTERS, role }, roles).slice(
    0,
    5
  );

  // Skills for the chosen role come first
  const skills = content.technicalSkills
    .map((category) => ({
      ...category,
      skills: chosen
        ? category.skills.filter((s) => roles.skillMatches(s, chosen.id))
        : category.skills,
    }))
    .filter((category) => category.skills.length > 0);

  const contact = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean);
  const links = getProfiles(personalInfo).map((profile) => profile.url);

  return (
    <div className="min-h-screen bg-white text-slate-800 print:bg-white">
      <div className="no-print border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <Link
            href={role === 'all' ? '/' : `/?role=${role}`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Back to the portfolio
          </Link>
          <nav aria-label="CV for a role" className="flex flex-wrap gap-1.5">
            {roles.switchOptions.map((id) => (
              <Link
                key={id}
                href={id === 'all' ? '/resume' : `/resume?role=${id}`}
                aria-current={role === id ? 'page' : undefined}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  role === id
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {id === 'all' ? t('role.all') : roles.title(id)}
              </Link>
            ))}
          </nav>
          <PrintButton />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <header className="border-b-2 border-slate-900 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{personalInfo.name}</h1>
          <p className="mt-1 text-lg font-medium text-slate-700">
            {roleView?.headline || personalInfo.title}
          </p>
          <p className="mt-2 text-sm text-slate-600">{contact.join('  ·  ')}</p>
          {links.length > 0 && (
            <p className="mt-0.5 text-sm text-slate-600">{links.join('  ·  ')}</p>
          )}
        </header>

        <section className="mt-5">
          <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">Summary</h2>
          <p className="mt-1.5 text-sm leading-relaxed">
            {roleView?.summary || personalInfo.description}
          </p>
        </section>

        {skills.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
              Skills{chosen ? ` for ${roles.title(role)}` : ''}
            </h2>
            <dl className="mt-1.5 space-y-0.5 text-sm">
              {skills.map((category) => (
                <div key={category.category} className="flex gap-2">
                  <dt className="w-44 shrink-0 font-semibold">{category.category}</dt>
                  <dd>{category.skills.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {projects.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">Projects</h2>
            <ul className="mt-1.5 space-y-3">
              {projects.map((project) => (
                <li key={project.id} className="break-inside-avoid text-sm">
                  <p>
                    <span className="font-semibold">{project.title}</span>
                    {project.subtitle ? `, ${project.subtitle}` : ''}
                    {project.year ? ` (${project.year})` : ''}
                  </p>
                  <p className="leading-relaxed">{project.description}</p>
                  <p className="text-slate-600">Tech: {project.technologies.join(', ')}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.experience.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
              Experience
            </h2>
            <ul className="mt-1.5 space-y-3">
              {content.experience.map((item) => (
                <li key={item.id} className="break-inside-avoid text-sm">
                  <p>
                    <span className="font-semibold">{item.title}</span>, {item.company}
                    {item.period ? ` (${item.period})` : ''}
                  </p>
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                    {item.description.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.education.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
              Education
            </h2>
            <ul className="mt-1.5 space-y-1.5 text-sm">
              {content.education.map((item) => (
                <li key={item.id} className="break-inside-avoid">
                  <span className="font-semibold">{item.degree}</span>, {item.institution}
                  {item.period ? ` (${item.period})` : ''}
                  {item.grade ? `, ${item.grade}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.certifications.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
              Certifications
            </h2>
            <ul className="mt-1.5 space-y-0.5 text-sm">
              {content.certifications.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  {item.title}
                  {item.issuer ? `, ${item.issuer}` : ''}
                  {item.year ? ` (${item.year})` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.achievements.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
              Achievements
            </h2>
            <ul className="mt-1.5 space-y-0.5 text-sm">
              {content.achievements.map((item) => (
                <li key={item.title}>
                  <span className="font-semibold">{item.title}</span>
                  {item.description ? `: ${item.description}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
