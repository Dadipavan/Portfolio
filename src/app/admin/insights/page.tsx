'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChartLine } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader, Panel, buttonClass } from '@/components/admin/kit';
import { getPortfolioData } from '@/lib/dataManager';
import { RoleSet } from '@/lib/roles';
import { LAYOUTS, mergeSiteSettings } from '@/lib/siteSettings';
import type { Insights } from '@/lib/server/insights';

type State =
  | { kind: 'loading' }
  | { kind: 'setup' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: Insights };

const PERIODS = [7, 30, 90];

const STAT_LABELS: { event: string; label: string }[] = [
  { event: 'page_view', label: 'Page views' },
  { event: 'project_open', label: 'Project details opened' },
  { event: 'resume_download', label: 'Resume downloads' },
  { event: 'cv_view', label: 'CV views' },
  { event: 'role_switch', label: 'Role switches' },
  { event: 'quick_view', label: 'Summary opened' },
  { event: 'share_open', label: 'Share opened' },
  { event: 'data_download', label: 'Data downloads' },
];

export default function InsightsAdmin() {
  const [days, setDays] = useState(30);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [projectTitles, setProjectTitles] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<RoleSet>(
    () => new RoleSet(mergeSiteSettings(undefined).roles)
  );
  const [counting, setCounting] = useState(true);

  useEffect(() => {
    getPortfolioData()
      .then((data) => {
        setProjectTitles(Object.fromEntries(data.projects.map((p) => [String(p.id), p.title])));
        const settings = mergeSiteSettings(data.siteSettings);
        setRoles(new RoleSet(settings.roles));
        setCounting(settings.features.insights);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetch(`/api/insights?days=${days}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok && body.success) setState({ kind: 'ready', data: body as Insights });
        else if (body.setupRequired) setState({ kind: 'setup' });
        else setState({ kind: 'error', message: body.error || 'Could not load the insights.' });
      })
      .catch(
        () => !cancelled && setState({ kind: 'error', message: 'Could not reach the server.' })
      );
    return () => {
      cancelled = true;
    };
  }, [days]);

  const busiest = useMemo(
    () => (state.kind === 'ready' ? Math.max(0, ...state.data.perDay.map((d) => d.views)) : 0),
    [state]
  );
  const maxViews = Math.max(1, busiest);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <PageHeader
          icon={ChartLine}
          title="Insights"
          subtitle="Visits and clicks on your site. No cookies, no IP addresses, nothing that identifies a visitor."
        />

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Period">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={days === period}
              onClick={() => setDays(period)}
              className={`${buttonClass} ${days === period ? '!border-purple-600 !bg-purple-50 !text-purple-700' : ''}`}
            >
              Last {period} days
            </button>
          ))}
        </div>

        {!counting && (
          <Panel>
            <p className="text-sm text-amber-800">
              Counting is switched off, so no new visits are recorded. Switch &quot;Visitor
              insights&quot; on in Admin &gt; Appearance &gt; Other features.
            </p>
          </Panel>
        )}

        {state.kind === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
          </div>
        )}

        {state.kind === 'setup' && (
          <Panel title="One step to switch this on">
            <p className="text-sm text-gray-600">
              The table that stores the counts does not exist yet. In Supabase, open the{' '}
              <strong>SQL editor</strong>, paste the contents of{' '}
              <code className="rounded bg-gray-100 px-1">database/site_events.sql</code> from this
              project, and run it once. Then come back here.
            </p>
          </Panel>
        )}

        {state.kind === 'error' && (
          <Panel>
            <p role="alert" className="text-sm text-red-700">
              {state.message}
            </p>
          </Panel>
        )}

        {state.kind === 'ready' && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STAT_LABELS.map(({ event, label }) => (
                <div
                  key={event}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                    {state.data.totals[event] ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{label}</p>
                </div>
              ))}
            </div>

            <Panel title="Page views per day">
              {state.data.events === 0 ? (
                <p className="text-sm text-gray-600">No visits recorded in this period yet.</p>
              ) : (
                <div
                  role="img"
                  aria-label={`Page views per day over the last ${state.data.days} days`}
                  className="flex h-40 items-end gap-px"
                >
                  {state.data.perDay.map((day) => (
                    <div
                      key={day.date}
                      className="group relative flex h-full min-w-0 flex-1 items-end"
                      title={`${day.date}: ${day.views}`}
                    >
                      <div
                        className="w-full rounded-t bg-purple-500"
                        style={{
                          height: `${Math.max(day.views ? 4 : 1, (day.views / maxViews) * 100)}%`,
                          opacity: day.views ? 1 : 0.25,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Days are counted in UTC. Busiest day: {busiest} view{busiest === 1 ? '' : 's'}.
              </p>
            </Panel>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Panel title="Most opened projects">
                <List
                  items={state.data.topProjects.map((item) => ({
                    name: projectTitles[item.target] || item.target,
                    count: item.count,
                  }))}
                  empty="No project has been opened yet."
                />
              </Panel>
              <Panel title="Resume and CV">
                <List
                  items={state.data.resumeDownloads.map((item) => ({
                    name: item.target || 'CV',
                    count: item.count,
                  }))}
                  empty="No downloads yet."
                />
              </Panel>
              <Panel title="Roles visitors switch to">
                <List
                  items={state.data.roles.map((item) => ({
                    name: roles.title(item.role) || item.role,
                    count: item.count,
                  }))}
                  empty="Nobody has used the role switch yet."
                />
              </Panel>
              <Panel title="Looks seen">
                <List
                  items={state.data.layouts.map((item) => ({
                    name: LAYOUTS.find((l) => l.id === item.layout)?.name ?? item.layout,
                    count: item.count,
                  }))}
                  empty="No page views yet."
                />
              </Panel>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function List({ items, empty }: { items: { name: string; count: number }[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-gray-600">{empty}</p>;
  const max = Math.max(...items.map((item) => item.count));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-gray-900">{item.name}</span>
            <span className="text-gray-600 tabular-nums">{item.count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
