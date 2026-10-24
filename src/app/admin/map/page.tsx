'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, EyeOff, ListChecks, Lock } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader, Panel } from '@/components/admin/kit';
import type { MapSection } from '@/lib/server/contentMap';

// Which admin page edits each kind of content
const EDIT_PAGE: Record<string, string> = {
  personalInfo: '/admin/personal',
  technicalSkills: '/admin/skills',
  projects: '/admin/projects',
  experience: '/admin/experience',
  education: '/admin/education',
  certifications: '/admin/certifications',
  achievements: '/admin/achievements',
  currentFocus: '/admin/personal',
  quickFacts: '/admin/personal',
  recommendations: '/admin/recommendations',
  resumes: '/admin/resumes',
  siteSettings: '/admin/site',
};

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; sections: MapSection[] };

export default function ContentMapAdmin() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    fetch('/api/content-map', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (response.ok && body.success)
          setState({ kind: 'ready', sections: body.sections as MapSection[] });
        else setState({ kind: 'error', message: body.error || 'Could not load the content map.' });
      })
      .catch(() => setState({ kind: 'error', message: 'Could not reach the server.' }));
  }, []);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <PageHeader
          icon={ListChecks}
          title="Content map"
          subtitle="Everything stored in this admin panel, and where it shows up on your site"
        />

        {state.kind === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
          </div>
        )}

        {state.kind === 'error' && (
          <Panel>
            <p role="alert" className="text-sm text-red-700">
              {state.message}
            </p>
          </Panel>
        )}

        {state.kind === 'ready' &&
          state.sections.map((section) => {
            const problems = section.items.filter((item) => item.status !== 'shown').length;
            return (
              <details
                key={section.id}
                open={problems > 0}
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-gray-900">
                      {section.label}
                    </span>
                    <span className="block text-sm text-gray-500">Appears in: {section.where}</span>
                  </span>
                  <span className="flex items-center gap-3 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${problems > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {section.shown} of {section.stored} shown
                    </span>
                  </span>
                </summary>
                <div className="space-y-3 border-t border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-wrap gap-4 text-sm">
                    {EDIT_PAGE[section.id] && (
                      <a
                        href={EDIT_PAGE[section.id]}
                        className="font-medium text-purple-700 hover:underline"
                      >
                        Edit in the admin
                      </a>
                    )}
                    <a
                      href={section.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-purple-700 hover:underline"
                    >
                      See it on the site
                    </a>
                  </div>
                  {section.items.length === 0 ? (
                    <p className="text-sm text-gray-600">Nothing stored yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                      {section.items.map((item, index) => (
                        <li
                          key={`${item.label}-${index}`}
                          className="flex items-start gap-3 p-3 text-sm"
                        >
                          <span className="mt-0.5 shrink-0" aria-hidden="true">
                            {item.status === 'shown' ? (
                              <CircleCheck size={16} className="text-green-600" />
                            ) : item.status === 'private' ? (
                              <Lock size={16} className="text-gray-500" />
                            ) : (
                              <EyeOff size={16} className="text-amber-600" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium break-words text-gray-900">
                              {item.label}
                            </span>
                            {item.note && <span className="block text-gray-500">{item.note}</span>}
                          </span>
                          <span className="sr-only">{item.status}</span>
                          {item.href && (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 font-medium text-purple-700 hover:underline"
                            >
                              View
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            );
          })}
      </div>
    </AdminLayout>
  );
}
