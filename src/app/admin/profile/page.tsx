'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import { useConfirm, useNotify } from '@/components/admin/Feedback';
import {
  PageHeader,
  Panel,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/kit';
import { SingleFileEditor } from '@/components/admin/MediaEditors';
import { useFileLedger } from '@/components/admin/useFileLedger';
import { PhotoView, type PhotoShape } from '@/components/site/PhotoFrame';
import { getPortfolioDataForEditing, savePersonalPatch } from '@/lib/dataManager';
import { normalisePhoto } from '@/lib/normalize';
import { useDraftSync } from '@/lib/previewBus';
import { LAYOUTS } from '@/lib/siteSettings';
import type { MediaFile, PersonalInfo, ProfilePhoto } from '@/lib/types';

// The outlines the looks cut the photo to, with names a person would use
const SHAPES: { shape: PhotoShape; label: string; frame?: string }[] = [
  { shape: 'circle', label: 'Round' },
  { shape: 'arch', label: 'Arch' },
  { shape: 'portrait', label: 'Portrait' },
  { shape: 'square', label: 'Square' },
  { shape: 'oval', label: 'Oval' },
  {
    shape: 'polaroid',
    label: 'Print',
    // a print has a white border, wider at the bottom (the real looks style it themselves)
    frame: 'bg-white p-1.5 pb-5 shadow-md ring-1 ring-black/10',
  },
];

// "A, B and C"
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// What is saved: whole numbers for the position, two decimals for the zoom, and no empty description
function tidy(photo: ProfilePhoto): ProfilePhoto {
  const { alt, ...file } = photo.file;
  const description = alt?.trim();
  return {
    file: description ? { ...file, alt: description } : file,
    focusX: Math.round(photo.focusX),
    focusY: Math.round(photo.focusY),
    zoom: Math.round(photo.zoom * 100) / 100,
  };
}

const sameCrop = (a?: ProfilePhoto, b?: ProfilePhoto) =>
  JSON.stringify(a ? tidy(a) : null) === JSON.stringify(b ? tidy(b) : null);

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  shown,
  spoken,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  // the value as written beside the slider, and as read out to someone using a screen reader
  shown: string;
  spoken: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <span aria-hidden="true" className="text-sm text-gray-600 tabular-nums">
          {shown}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={spoken}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-6 w-full cursor-pointer accent-purple-600"
      />
    </div>
  );
}

export default function ProfilePhotoAdmin() {
  return (
    <AdminLayout>
      <ProfilePhotoContent />
    </AdminLayout>
  );
}

function ProfilePhotoContent() {
  const notify = useNotify();
  const confirm = useConfirm();
  const ledger = useFileLedger();
  const [personal, setPersonal] = useState<PersonalInfo | null>(null);
  // what is saved, and what is on the page now (they differ while there are unsaved changes)
  const [saved, setSaved] = useState<ProfilePhoto | undefined>(undefined);
  const [draft, setDraft] = useState<ProfilePhoto | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPortfolioDataForEditing()
      .then((data) => {
        const photo = normalisePhoto(data.personalInfo?.photo);
        setPersonal(data.personalInfo);
        setSaved(photo);
        setDraft(photo);
      })
      .catch((error: Error) => {
        console.error('Failed to load saved content:', error);
        setLoadError(error.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = !loading && !sameCrop(draft, saved);

  // the live preview shows the photo as it is on this page, before anything is saved
  const previewData = useMemo(
    () => (personal ? { ...personal, photo: draft } : null),
    [personal, draft]
  );
  useDraftSync('personalInfo', previewData, Boolean(personal));

  // the browser warns before the page is closed or reloaded with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loadError) return <AdminLoadError message={loadError} />;
  if (loading || !personal) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading your photo"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const name = personal.name || personal.shortName || 'you';
  const withPhoto = LAYOUTS.filter((look) => look.photo).map((look) => look.name);
  const withoutPhoto = LAYOUTS.filter((look) => !look.photo).map((look) => look.name);

  // a new picture starts with the whole picture centred; no picture means no photo at all
  const onFile = (file: MediaFile | undefined) =>
    setDraft(
      file ? { file: { ...file, kind: 'photo' }, focusX: 50, focusY: 50, zoom: 1 } : undefined
    );
  const setCrop = (patch: Partial<Pick<ProfilePhoto, 'focusX' | 'focusY' | 'zoom'>>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const setAlt = (alt: string) =>
    setDraft((current) => (current ? { ...current, file: { ...current.file, alt } } : current));

  const save = async () => {
    const photo = draft ? tidy(draft) : undefined;
    setSaving(true);
    // only the photo is written, on top of whatever is saved right now
    const result = await savePersonalPatch({ photo });
    setSaving(false);
    if (!result) {
      notify.error(
        'Your photo could not be saved. Nothing is lost: it is all still on this page. Please try again.'
      );
      return;
    }
    setPersonal(result);
    setSaved(photo);
    setDraft(photo);
    try {
      await ledger.afterSave(photo ? [photo.file.path] : []);
    } catch (error) {
      console.error('Tidying up stored files failed:', error);
    }
    notify.success(
      photo
        ? 'Saved. Your photo is updated on the looks that show one.'
        : 'Saved. The photo has been removed from your site.'
    );
  };

  const discard = async () => {
    const ok = await confirm({
      title: 'Discard your changes?',
      message: 'The photo goes back to how it was when you last saved.',
      confirmLabel: 'Discard changes',
      cancelLabel: 'Keep editing',
      danger: true,
    });
    if (!ok) return;
    // a file uploaded since the last save is deleted from storage again
    await ledger.afterCancel(saved ? [saved.file.path] : []);
    setDraft(saved);
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        icon={Camera}
        title="Profile photo"
        subtitle="Upload a photo, choose how it is cropped, and see it in the shapes the looks use"
      />

      <div className="max-w-4xl space-y-6">
        <Panel
          title="Your photo"
          description="A photo is optional: every look works without one and shows your initials instead. Looks that have a place for a photo use it automatically."
        >
          <SingleFileEditor
            file={draft?.file}
            onChange={onFile}
            kind="photo"
            ledger={ledger}
            label="Photo"
            help="A clear, well-lit picture works best. It is made web-sized for you."
          />
          {draft && (
            <div>
              <label htmlFor="photo-alt" className={labelClass}>
                Describe the photo for people who cannot see it
              </label>
              <input
                id="photo-alt"
                type="text"
                maxLength={200}
                value={draft.file.alt ?? ''}
                onChange={(event) => setAlt(event.target.value)}
                placeholder={`Photo of ${name}`}
                className={inputClass}
              />
              <p className={hintClass}>
                Optional. Left empty, a screen reader says &quot;Photo of {name}&quot;.
              </p>
            </div>
          )}
        </Panel>

        <Panel
          title="Crop and preview"
          description="Every look cuts the photo to its own shape. These are all of them, showing the crop you choose below."
        >
          <p className="sr-only">Your photo cut to six shapes. The pictures are for sighted preview only.</p>
          <div
            aria-hidden="true"
            className="grid grid-cols-3 items-end gap-x-4 gap-y-5 rounded-lg bg-gray-50 p-4 sm:grid-cols-6"
          >
            {SHAPES.map(({ shape, label, frame }) => (
              <figure key={shape} className="flex flex-col items-center gap-2">
                <div className="w-full max-w-24">
                  <PhotoView
                    photo={draft}
                    name={name}
                    shortName={personal.shortName}
                    shape={shape}
                    className={frame}
                  />
                </div>
                <figcaption className="text-xs font-medium text-gray-600">{label}</figcaption>
              </figure>
            ))}
          </div>

          {draft ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Slider
                  id="photo-focus-x"
                  label="Move left or right"
                  value={draft.focusX}
                  min={0}
                  max={100}
                  step={1}
                  shown={`${draft.focusX}%`}
                  spoken={`${draft.focusX} percent`}
                  onChange={(focusX) => setCrop({ focusX })}
                />
                <Slider
                  id="photo-focus-y"
                  label="Move up or down"
                  value={draft.focusY}
                  min={0}
                  max={100}
                  step={1}
                  shown={`${draft.focusY}%`}
                  spoken={`${draft.focusY} percent`}
                  onChange={(focusY) => setCrop({ focusY })}
                />
                <Slider
                  id="photo-zoom"
                  label="Zoom"
                  value={draft.zoom}
                  min={1}
                  max={3}
                  step={0.05}
                  shown={`${draft.zoom.toFixed(2)}×`}
                  spoken={`${draft.zoom.toFixed(2)} times`}
                  onChange={(zoom) => setCrop({ zoom })}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setCrop({ focusX: 50, focusY: 50, zoom: 1 })}
                  disabled={draft.focusX === 50 && draft.focusY === 50 && draft.zoom === 1}
                  className={buttonClass}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Reset the crop
                </button>
              </div>
              <p className={hintClass}>
                The point you choose stays where you put it when a look cuts the photo to a different
                shape, and zooming enlarges the photo around that point.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              No photo yet. Choose a file above to add one, then come back here to crop it. The
              round, arch and other shapes above show your initials until then.
            </p>
          )}
        </Panel>

        <Panel title="Where it appears">
          <p className="text-sm text-gray-700">
            <strong>Looks with a place for your photo:</strong> {joinNames(withPhoto)}.
          </p>
          <p className="text-sm text-gray-700">
            <strong>Looks without a photo layout:</strong> {joinNames(withoutPhoto)}. They work as
            they are and never need a photo.
          </p>
          <p className={hintClass}>
            Choose the look in{' '}
            <a href="/admin/appearance" className="font-medium text-purple-700 hover:underline">
              Templates and look
            </a>
            .
          </p>
        </Panel>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className={primaryButtonClass}
        >
          {saving ? 'Saving...' : 'Save photo'}
        </button>
        <button type="button" onClick={discard} disabled={saving || !dirty} className={buttonClass}>
          Discard changes
        </button>
        {dirty && !saving && <span className="text-sm text-amber-800">Unsaved changes</span>}
      </div>
    </div>
  );
}
