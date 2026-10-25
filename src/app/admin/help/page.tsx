'use client';

// Help: for everything a visitor sees (and every file you can upload), where it comes from, how to change
// it and where it shows. Information only: nothing here changes any content.
import { useMemo, useState } from 'react';
import { ArrowRight, CircleHelp, ExternalLink, Search, Type } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { PageBanner } from '@/components/admin/kit';
import { COPY_FIELDS } from '@/lib/copy';
import { HELP_AREAS, HELP_TOPICS, type HelpArea, type HelpTopic } from '@/lib/helpTopics';

const FIELD_LABEL = new Map(COPY_FIELDS.map((f) => [f.key as string, f.label]));
const FIELD_TEXT = new Map(COPY_FIELDS.map((f) => [f.key as string, f.text]));

function matches(topic: HelpTopic, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    topic.title,
    topic.seen,
    topic.from,
    topic.area,
    ...(topic.words ?? []),
    ...topic.steps.map((s) => s.text),
    ...(topic.textKeys ?? []).flatMap((k) => [FIELD_LABEL.get(k) ?? '', FIELD_TEXT.get(k) ?? '']),
  ]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

function TopicCard({ topic }: { topic: HelpTopic }) {
  return (
    <article id={topic.id} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">{topic.title}</h3>
        {topic.anchor && (
          <a
            href={topic.anchor}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:underline"
          >
            See it on the site <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>

      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-gray-400 uppercase">What you see</dt>
          <dd className="mt-0.5 text-gray-700">{topic.seen}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Where it comes from</dt>
          <dd className="mt-0.5 text-gray-700">{topic.from}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">How to change it</p>
        <ol className="mt-2 space-y-2">
          {topic.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                {step.text}
                {step.href && (
                  <a
                    href={step.href}
                    className="ml-2 inline-flex items-center gap-1 whitespace-nowrap font-medium text-purple-700 hover:underline"
                  >
                    Open <ArrowRight size={13} aria-hidden="true" />
                  </a>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {topic.textKeys && topic.textKeys.length > 0 && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            <Type size={13} aria-hidden="true" /> Wording you can rename
          </p>
          <ul className="mt-2 space-y-1.5">
            {topic.textKeys.map((key) => (
              <li key={key} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <a
                  href={`/admin/text?find=${encodeURIComponent(FIELD_LABEL.get(key) ?? key)}`}
                  className="font-medium text-purple-700 hover:underline"
                >
                  {FIELD_LABEL.get(key) ?? key}
                </a>
                <span className="text-gray-500">&ldquo;{FIELD_TEXT.get(key)}&rdquo;</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<HelpArea | 'all'>('all');
  const needle = search.trim().toLowerCase();

  const shown = useMemo(
    () => HELP_TOPICS.filter((t) => (area === 'all' || t.area === area) && matches(t, needle)),
    [area, needle]
  );
  const groups = HELP_AREAS.map((a) => ({ area: a, topics: shown.filter((t) => t.area === a) })).filter(
    (g) => g.topics.length > 0
  );

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <PageBanner
          icon={CircleHelp}
          title="Help"
          subtitle="Where each part of your site comes from, how to change it, and how to upload files"
          chips={[`${HELP_TOPICS.length} topics`, 'Information only: nothing here changes your site']}
        />

        <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              aria-label="Search the help"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search: heatmap, upload photo, technology map, resume, colour…"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pr-3 pl-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/15"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by area">
            {(['all', ...HELP_AREAS] as const).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={area === a}
                onClick={() => setArea(a)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  area === a ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a === 'all' ? 'Everything' : a}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">Nothing matches &ldquo;{search}&rdquo;</p>
            <p className="mt-1 text-sm text-gray-500">Try a word you see on the site, like &ldquo;heatmap&rdquo; or &ldquo;certificate&rdquo;.</p>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.area} aria-labelledby={`area-${g.area}`} className="space-y-3">
            <h2 id={`area-${g.area}`} className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
              {g.area}
            </h2>
            {g.topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
