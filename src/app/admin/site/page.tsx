'use client';

import { useMemo } from 'react';
import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import {
  PageHeader,
  Panel,
  SaveBar,
  StringListEditor,
  Toggle,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
} from '@/components/admin/kit';
import { useSettingsEditor } from '@/lib/useSettingsEditor';

const OWNED = [
  'availability',
  'additionalCertifications',
  'contactTopics',
  'workWithMe',
  'highlights',
] as const;

export default function SiteSettingsAdmin() {
  const { settings, update, loading, loadError, saving, status, dirty, save } = useSettingsEditor(
    useMemo(() => [...OWNED], [])
  );

  if (loadError) {
    return (
      <AdminLayout>
        <AdminLoadError message={loadError} />
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const { availability, workWithMe: work, highlights } = settings;
  const setWork = (patch: Partial<typeof work>) => update({ workWithMe: { ...work, ...patch } });
  const setHighlight = (index: number, patch: Partial<(typeof highlights)[number]>) =>
    update({
      highlights: highlights.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-4">
        <PageHeader
          icon={SlidersHorizontal}
          title="Site settings"
          subtitle="Availability, key numbers, work-with-me details and other options for your homepage"
        />

        <Panel
          title="Availability badge"
          description='A small badge with a green dot at the top of your homepage, for example "Open to opportunities".'
        >
          <Toggle
            checked={availability.enabled}
            onChange={(value) => update({ availability: { ...availability, enabled: value } })}
            label="Show the badge on my homepage"
          />
          <div>
            <label htmlFor="availability-text" className={labelClass}>
              Badge text
            </label>
            <input
              id="availability-text"
              type="text"
              maxLength={60}
              value={availability.text}
              onChange={(event) =>
                update({ availability: { ...availability, text: event.target.value } })
              }
              className={inputClass}
            />
          </div>
        </Panel>

        <Panel
          title="Key numbers"
          description="The number tiles at the top of your homepage. Leave this list empty and they are worked out from your content (projects, technologies, certifications, CGPA)."
        >
          {highlights.map((item, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="min-w-0 flex-1 basis-40">
                <label htmlFor={`highlight-value-${index}`} className={labelClass}>
                  Number
                </label>
                <input
                  id={`highlight-value-${index}`}
                  type="text"
                  maxLength={24}
                  value={item.value}
                  onChange={(event) => setHighlight(index, { value: event.target.value })}
                  className={inputClass}
                  placeholder="12+"
                />
              </div>
              <div className="min-w-0 flex-[2] basis-48">
                <label htmlFor={`highlight-label-${index}`} className={labelClass}>
                  What it counts
                </label>
                <input
                  id={`highlight-label-${index}`}
                  type="text"
                  maxLength={40}
                  value={item.label}
                  onChange={(event) => setHighlight(index, { label: event.target.value })}
                  className={inputClass}
                  placeholder="Projects"
                />
              </div>
              <button
                type="button"
                onClick={() => update({ highlights: highlights.filter((_, i) => i !== index) })}
                className="mb-1 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove key number ${index + 1}`}
                title="Remove"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update({ highlights: [...highlights, { label: '', value: '' }] })}
            disabled={highlights.length >= 8}
            className={buttonClass}
          >
            <Plus size={16} aria-hidden="true" />
            Add a number
          </button>
          <p className={hintClass}>
            Numbers count up when they appear (switch that off in Appearance). Up to 8. Rows left
            empty are ignored when you save.
          </p>
        </Panel>

        <Panel
          title="Work with me"
          description="The panel that tells recruiters what you are looking for and how to start. It appears only while switched on in Appearance and here."
        >
          <Toggle
            checked={work.enabled}
            onChange={(value) => setWork({ enabled: value })}
            label="Show the Work with me panel"
          />
          <div>
            <p className={labelClass}>Roles I am looking for</p>
            <StringListEditor
              items={work.roles}
              onChange={(roles) => setWork({ roles })}
              label="Role"
              addLabel="Add a role"
              placeholder="Data Scientist"
              maxItems={12}
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="work-location" className={labelClass}>
                Based in
              </label>
              <input
                id="work-location"
                type="text"
                value={work.location}
                onChange={(e) => setWork({ location: e.target.value })}
                className={inputClass}
                placeholder="Leave empty to use your location"
              />
            </div>
            <div>
              <label htmlFor="work-remote" className={labelClass}>
                Remote or on-site
              </label>
              <input
                id="work-remote"
                type="text"
                value={work.remote}
                onChange={(e) => setWork({ remote: e.target.value })}
                className={inputClass}
                placeholder="Open to remote, hybrid or on-site"
              />
            </div>
            <div>
              <label htmlFor="work-start" className={labelClass}>
                Available from
              </label>
              <input
                id="work-start"
                type="text"
                value={work.startDate}
                onChange={(e) => setWork({ startDate: e.target.value })}
                className={inputClass}
                placeholder="July 2026"
              />
            </div>
            <div>
              <label htmlFor="work-contact" className={labelClass}>
                Best way to reach me
              </label>
              <input
                id="work-contact"
                type="text"
                value={work.contact}
                onChange={(e) => setWork({ contact: e.target.value })}
                className={inputClass}
                placeholder="Leave empty to use your email"
              />
            </div>
          </div>
          <div>
            <label htmlFor="work-booking" className={labelClass}>
              Booking link
            </label>
            <input
              id="work-booking"
              type="url"
              value={work.bookingUrl}
              onChange={(e) => setWork({ bookingUrl: e.target.value })}
              className={inputClass}
              placeholder="https://cal.com/your-name"
            />
            <p className={hintClass}>
              Adds a &quot;Book a call&quot; button (Calendly, Cal.com, Google Calendar...). Leave
              empty for none.
            </p>
          </div>
          <div>
            <label htmlFor="work-note" className={labelClass}>
              A short note
            </label>
            <textarea
              id="work-note"
              rows={3}
              value={work.note}
              onChange={(e) => setWork({ note: e.target.value })}
              className={`${inputClass} resize-y`}
            />
          </div>
        </Panel>

        <Panel
          title="Contact form topics"
          description='The choices in the "What is this about?" list. The first one is the usual topic and is not added to the message subject.'
        >
          <StringListEditor
            items={settings.contactTopics}
            onChange={(contactTopics) => update({ contactTopics })}
            label="Topic"
            addLabel="Add a topic"
            maxItems={10}
            maxLength={60}
          />
          <p className={hintClass}>With no topics, the list is not shown on the form.</p>
        </Panel>

        <Panel
          title="Additional certifications"
          description="Short one-line entries listed under your certification cards, for credentials that do not need a card of their own."
        >
          {settings.additionalCertifications.length === 0 && (
            <p className="text-sm text-gray-500">
              None yet. This list is hidden on the homepage while it is empty.
            </p>
          )}
          <StringListEditor
            items={settings.additionalCertifications}
            onChange={(additionalCertifications) => update({ additionalCertifications })}
            label="Additional certification"
            addLabel="Add a certification"
            maxItems={30}
          />
        </Panel>
      </div>
      <SaveBar onSave={() => save()} saving={saving} dirty={dirty} status={status} />
    </AdminLayout>
  );
}
