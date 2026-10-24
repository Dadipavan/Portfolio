'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Palette } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import LayoutThumb from '@/components/admin/LayoutThumb';
import LookPreview from '@/components/admin/LookPreview';
import {
  PageHeader,
  Panel,
  SaveBar,
  Toggle,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
} from '@/components/admin/kit';
import { PhotoView } from '@/components/site/PhotoFrame';
import { makeTranslate } from '@/lib/copy';
import { buildSiteModel, chosenOrder, SECTION_ORDER } from '@/lib/model';
import { buildContent, normalisePhoto } from '@/lib/normalize';
import {
  ACCENTS,
  DATA_STYLE_FEATURES,
  FEATURES,
  LAYOUTS,
  SECTION_NOTES,
  THEME_MODES,
  WIDGETS,
  type LayoutInfo,
} from '@/lib/siteSettings';
import type { AccentId, FeatureId, LayoutId, SectionId, ThemeMode, WidgetId } from '@/lib/types';
import { useSettingsEditor } from '@/lib/useSettingsEditor';

const OWNED = ['appearance', 'features', 'sections', 'kicker'] as const;

// "A, B and C"
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export default function AppearanceAdmin() {
  const editor = useSettingsEditor(useMemo(() => [...OWNED], []));
  const { settings, update, loading, loadError, saving, status, dirty, save, portfolio } = editor;
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  // the look shown in the preview dialog (null = the dialog is closed)
  const [previewId, setPreviewId] = useState<LayoutId | null>(null);
  const closePreview = useCallback(() => setPreviewId(null), []);

  // which sections have something to show right now (with nothing switched off)
  const present = useMemo(() => {
    if (!portfolio) return new Set<SectionId>();
    const raw = {
      ...(portfolio as unknown as Record<string, unknown>),
      siteSettings: { ...settings, sections: { order: [], hidden: [] } },
    };
    return new Set(buildSiteModel(buildContent(raw)).sections.map((section) => section.id));
  }, [portfolio, settings]);

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

  const { appearance, features, sections } = settings;
  const t = makeTranslate(settings.copy);
  const setAppearance = (patch: Partial<typeof appearance>) =>
    update({ appearance: { ...appearance, ...patch } });
  const setFeature = (id: FeatureId, value: boolean) =>
    update({ features: { ...features, [id]: value } });

  // ---- the look in use, and the facts that depend on it
  const lookInUse: LayoutInfo = LAYOUTS.find((l) => l.id === appearance.layout) ?? LAYOUTS[0];
  const previewLook = LAYOUTS.find((l) => l.id === previewId) ?? null;
  const accentLocked = lookInUse.ownColours;
  const accentLooks = LAYOUTS.filter((l) => !l.ownColours).map((l) => l.name);
  const photoLooks = LAYOUTS.filter((l) => l.photo).map((l) => l.name);
  const personal = portfolio?.personalInfo;
  const photo = normalisePhoto(personal?.photo);
  const chooseLook = (look: LayoutInfo) => {
    setAppearance({ layout: look.id });
    closePreview();
  };

  // ---- data-enthusiast master switch
  const styleOn = DATA_STYLE_FEATURES.filter((id) => features[id]).length;
  const styleAll = styleOn === DATA_STYLE_FEATURES.length;
  const styleMixed = styleOn > 0 && !styleAll;
  const setStyle = (value: boolean) =>
    update({
      features: {
        ...features,
        ...Object.fromEntries(DATA_STYLE_FEATURES.map((id) => [id, value])),
      } as typeof features,
    });

  // ---- charts
  const enabledWidgets = appearance.widgets;
  const disabledWidgets = WIDGETS.filter((w) => !enabledWidgets.includes(w.id)).map((w) => w.id);
  const moveWidget = (id: WidgetId, direction: -1 | 1) => {
    const index = enabledWidgets.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= enabledWidgets.length) return;
    const next = [...enabledWidgets];
    [next[index], next[target]] = [next[target], next[index]];
    setAppearance({ widgets: next });
  };
  const setWidget = (id: WidgetId, on: boolean) =>
    setAppearance({
      widgets: on ? [...enabledWidgets, id] : enabledWidgets.filter((w) => w !== id),
    });

  // ---- sections
  const order = chosenOrder(sections.order, SECTION_ORDER[appearance.layout]);
  const moveSection = (id: SectionId, direction: -1 | 1) => {
    const index = order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    update({ sections: { ...sections, order: next } });
  };
  const setSectionShown = (id: SectionId, shown: boolean) =>
    update({
      sections: {
        ...sections,
        hidden: shown ? sections.hidden.filter((h) => h !== id) : [...sections.hidden, id],
      },
    });

  const featureGroups = Array.from(new Set(FEATURES.map((f) => f.group)));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-8 pb-4">
        <PageHeader
          icon={Palette}
          title="Appearance"
          subtitle="The look of your site, its colours, charts and the order of its sections"
        />

        <Panel
          title="Look"
          description="Thirteen complete designs for the same content. Switch any time; nothing you wrote changes. Use Preview to see your own content in a look first."
        >
          <div
            role="radiogroup"
            aria-label="Look of the site"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {LAYOUTS.map((layout) => {
              const selected = appearance.layout === layout.id;
              return (
                <div
                  key={layout.id}
                  className={`flex flex-col rounded-xl border-2 transition-colors ${
                    selected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={layout.name}
                    aria-describedby={`look-${layout.id}-about`}
                    onClick={() => setAppearance({ layout: layout.id as LayoutId })}
                    className="flex-1 rounded-t-[0.6rem] p-3 text-left"
                  >
                    <LayoutThumb id={layout.id} />
                    <span className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900">{layout.name}</span>
                      {selected && (
                        <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
                          In use
                        </span>
                      )}
                    </span>
                    <span id={`look-${layout.id}-about`} className="mt-1 block text-sm text-gray-600">
                      {layout.description}
                    </span>
                    {(layout.photo || layout.ownColours) && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {layout.photo && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            Photo layout
                          </span>
                        )}
                        {layout.ownColours && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">
                            Own colours
                          </span>
                        )}
                      </span>
                    )}
                    <span className="mt-2 block space-y-0.5 text-xs text-gray-600">
                      <span className="block">
                        <span className="font-medium text-gray-700">Menu:</span> {layout.menu}
                      </span>
                      <span className="block">
                        <span className="font-medium text-gray-700">Lettering:</span>{' '}
                        {layout.typeface}
                      </span>
                    </span>
                  </button>
                  <div className="border-t border-gray-200/70 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setPreviewId(layout.id)}
                      aria-haspopup="dialog"
                      aria-label={`Preview the ${layout.name} look`}
                      className={`${buttonClass} w-full`}
                    >
                      <Eye size={16} aria-hidden="true" />
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <details className="rounded-xl border border-gray-200 bg-gray-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900">
              How to choose a look
            </summary>
            <div className="space-y-4 border-t border-gray-200 px-4 py-4">
              <p className="text-sm text-gray-600">
                Every look shows the same content and has the same features. They differ in how the
                page is arranged, the lettering, the colours and how a visitor moves around. Looks
                with a photo layout ({joinNames(photoLooks)}) use the photo from Profile photo; the
                others work without one.
              </p>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Comparison of the looks</caption>
                  <thead>
                    <tr className="border-b border-gray-200 text-xs tracking-wide text-gray-600 uppercase">
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Look
                      </th>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Best for
                      </th>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Menu
                      </th>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Lettering
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        Photo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 align-top text-gray-700">
                    {LAYOUTS.map((layout) => (
                      <tr key={layout.id}>
                        <th scope="row" className="py-2 pr-4 font-semibold text-gray-900">
                          {layout.name}
                        </th>
                        <td className="py-2 pr-4">{layout.bestFor}</td>
                        <td className="py-2 pr-4">{layout.menu}</td>
                        <td className="py-2 pr-4">{layout.typeface}</td>
                        <td className="py-2">{layout.photo ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="space-y-3 md:hidden">
                {LAYOUTS.map((layout) => (
                  <li key={layout.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="font-semibold text-gray-900">{layout.name}</p>
                    <dl className="mt-1 space-y-1 text-sm text-gray-600">
                      <div>
                        <dt className="inline font-medium text-gray-800">Best for: </dt>
                        <dd className="inline">{layout.bestFor}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-gray-800">Menu: </dt>
                        <dd className="inline">{layout.menu}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-gray-800">Lettering: </dt>
                        <dd className="inline">{layout.typeface}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-gray-800">Photo layout: </dt>
                        <dd className="inline">{layout.photo ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </Panel>

        <Panel
          title="Your photo"
          description="Some looks have a place for your photo. It is never required: the other looks work without one."
        >
          {lookInUse.photo ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-16 shrink-0">
                <PhotoView
                  photo={photo}
                  name={personal?.name ?? ''}
                  shortName={personal?.shortName}
                  shape="circle"
                />
              </div>
              <p className="min-w-0 flex-1 text-sm text-gray-700">
                {photo
                  ? `The ${lookInUse.name} look shows your photo.`
                  : `The ${lookInUse.name} look has a place for your photo and shows your initials until you add one.`}
              </p>
              <a href="/admin/profile" className={buttonClass}>
                Add or change the photo
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              This look does not show a photo. Looks that do: {joinNames(photoLooks)}.{' '}
              <a href="/admin/profile" className="font-medium text-purple-700 hover:underline">
                Add or change the photo
              </a>
              .
            </p>
          )}
        </Panel>

        <Panel
          title="Colours"
          description="Light, dark and the accent colour used for buttons, links and highlights."
        >
          <fieldset>
            <legend className={labelClass}>Theme</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {THEME_MODES.map((mode) => (
                <label
                  key={mode.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                    appearance.theme === mode.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    checked={appearance.theme === mode.id}
                    onChange={() => setAppearance({ theme: mode.id as ThemeMode })}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{mode.label}</span>
                    <span className="block text-sm text-gray-500">{mode.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Toggle
            checked={appearance.allowVisitorTheme}
            onChange={(value) => setAppearance({ allowVisitorTheme: value })}
            label="Let visitors switch between light and dark"
            description="Shows the sun / moon button. Their choice is remembered on their device only."
          />

          <fieldset>
            <legend className={labelClass}>Accent colour</legend>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((accent) => {
                const selected = appearance.accent === accent.id;
                return (
                  <button
                    key={accent.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={accentLocked}
                    aria-disabled={accentLocked}
                    aria-describedby={accentLocked ? 'accent-note' : undefined}
                    onClick={() => setAppearance({ accent: accent.id as AccentId })}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: accent.swatch }}
                    />
                    {accent.label}
                  </button>
                );
              })}
            </div>
            {accentLocked && (
              <p id="accent-note" className="mt-2 text-sm text-gray-600">
                {lookInUse.name} has its own colours, so the accent colour does not apply to it. The
                accent applies to {joinNames(accentLooks)}.
              </p>
            )}
          </fieldset>

          <Toggle
            checked={appearance.animations}
            onChange={(value) => setAppearance({ animations: value })}
            label="Animations"
            description="Counting numbers, drifting dots and gentle fades. Visitors who ask their device for less motion never see them."
          />
        </Panel>

        <Panel
          title="Data-enthusiast style"
          description="The touches that tell visitors you love data. One switch turns them all on or off; use the list underneath to keep only some."
        >
          <Toggle
            checked={styleAll}
            mixed={styleMixed}
            onChange={setStyle}
            label="Data-enthusiast style"
            description={
              styleMixed
                ? `${styleOn} of ${DATA_STYLE_FEATURES.length} touches are on. Switch on to turn them all on.`
                : styleAll
                  ? 'On: hero chart, counting numbers, query bar, charts, data downloads and the pipeline look.'
                  : 'Off: a plain, professional portfolio without the data touches.'
            }
          />
          <div>
            <label htmlFor="kicker" className={labelClass}>
              Label above your name
            </label>
            <input
              id="kicker"
              type="text"
              maxLength={40}
              value={settings.kicker}
              onChange={(event) => update({ kicker: event.target.value })}
              className={inputClass}
              placeholder="Data enthusiast"
            />
            <p className={hintClass}>
              Shown only while the style is on. Leave it empty to hide it, or try &quot;Data
              scientist in the making&quot;.
            </p>
          </div>
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {FEATURES.filter((f) => f.group === 'Data-enthusiast style').map((feature) => (
              <Toggle
                key={feature.id}
                checked={features[feature.id]}
                onChange={(value) => setFeature(feature.id, value)}
                label={feature.label}
                description={feature.description}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Charts"
          description="Choose which charts appear in the Insights section and the order they come in."
        >
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {[...enabledWidgets, ...disabledWidgets].map((id) => {
              const widget = WIDGETS.find((w) => w.id === id)!;
              const on = enabledWidgets.includes(id);
              const index = enabledWidgets.indexOf(id);
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(event) => setWidget(id, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {widget.label}
                      </span>
                      <span className="block text-sm text-gray-500">{widget.description}</span>
                    </span>
                  </label>
                  {on && (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveWidget(id, -1)}
                        disabled={index === 0}
                        className={`${buttonClass} !px-2`}
                        aria-label={`Move ${widget.label} up`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(id, 1)}
                        disabled={index === enabledWidgets.length - 1}
                        className={`${buttonClass} !px-2`}
                        aria-label={`Move ${widget.label} down`}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={hintClass}>
            The number tiles also appear at the top of the page. Charts need at least one project.
          </p>
        </Panel>

        <Panel
          title="Sections"
          description={
            appearance.layout === 'story'
              ? 'The Data story look follows its own storyline, so the order below does not apply to it. You can still hide sections.'
              : 'The order of the sections down the page, and which ones to show. A section with nothing in it is skipped automatically.'
          }
        >
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {order.map((id, index) => {
              const shown = !sections.hidden.includes(id);
              const hasContent = present.has(id);
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                  <span className="w-6 shrink-0 text-center font-mono text-xs text-gray-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${shown ? 'text-gray-900' : 'text-gray-400 line-through'}`}
                    >
                      {t(`section.${id}.label`)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {SECTION_NOTES[id]}
                      {!hasContent && shown && (
                        <span className="ml-1 font-medium text-amber-700">
                          Nothing to show yet.
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSectionShown(id, !shown)}
                    aria-pressed={shown}
                    className={`${buttonClass} ${shown ? '' : 'text-gray-500'}`}
                    title={
                      shown ? 'Shown on the site. Select to hide it.' : 'Hidden. Select to show it.'
                    }
                  >
                    {shown ? (
                      <Eye size={16} aria-hidden="true" />
                    ) : (
                      <EyeOff size={16} aria-hidden="true" />
                    )}
                    {shown ? 'Shown' : 'Hidden'}
                  </button>
                  {appearance.layout !== 'story' && (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(id, -1)}
                        disabled={index === 0}
                        className={`${buttonClass} !px-2`}
                        aria-label={`Move ${t(`section.${id}.label`)} up`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(id, 1)}
                        disabled={index === order.length - 1}
                        className={`${buttonClass} !px-2`}
                        aria-label={`Move ${t(`section.${id}.label`)} down`}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {(sections.order.length > 0 || sections.hidden.length > 0) && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => update({ sections: { order: [], hidden: [] } })}
            >
              Back to the usual order, show everything
            </button>
          )}
          <p className={hintClass}>Rename sections and change their headings in Text and labels.</p>
        </Panel>

        <Panel
          title="Other features"
          description="Switch tools on or off. Anything switched off disappears from the site."
        >
          <button
            type="button"
            className={buttonClass}
            onClick={() => setShowAllFeatures((value) => !value)}
            aria-expanded={showAllFeatures}
          >
            {showAllFeatures ? 'Hide the list' : 'Show the list'}
          </button>
          {showAllFeatures &&
            featureGroups
              .filter((group) => group !== 'Data-enthusiast style')
              .map((group) => (
                <div key={group} className="space-y-3 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                    {group}
                  </h3>
                  {FEATURES.filter((f) => f.group === group).map((feature) => (
                    <Toggle
                      key={feature.id}
                      checked={features[feature.id]}
                      onChange={(value) => setFeature(feature.id, value)}
                      label={feature.label}
                      description={feature.description}
                    />
                  ))}
                </div>
              ))}
        </Panel>
      </div>
      <SaveBar onSave={() => save()} saving={saving} dirty={dirty} status={status} />
      <LookPreview
        look={previewLook}
        selected={previewLook?.id === appearance.layout}
        onClose={closePreview}
        onUse={chooseLook}
      />
    </AdminLayout>
  );
}
