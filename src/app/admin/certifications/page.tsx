'use client';

import { useState } from 'react';
import { Award, FileText, Plus } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import { useNotify } from '@/components/admin/Feedback';
import {
  FieldError,
  PageHeader,
  Panel,
  TagsInput,
  Toggle,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/kit';
import { EditorBar, RowActions, StatusBadge } from '@/components/admin/ListParts';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import { FileThumb, SingleFileEditor } from '@/components/admin/MediaEditors';
import { useEditor } from '@/components/admin/useEditor';
import { idOf, useListOps } from '@/components/admin/useListOps';
import { isPdfUrl } from '@/lib/media';
import { normaliseCertifications } from '@/lib/normalize';
import { useDraftSync } from '@/lib/previewBus';
import type { Certification } from '@/lib/types';
import { toWebUrl } from '@/lib/url';
import { newItemId, useStoredList } from '@/lib/useStoredList';

type Stored = Record<string, unknown>;

const DESCRIPTION_LIMIT = 2000;

const blank = (): Certification => ({
  id: newItemId(),
  title: '',
  issuer: '',
  year: '',
  issueDate: '',
  credentialId: '',
  description: '',
  skills: [],
  verificationUrl: '',
  visible: false,
});

const yearOf = (date: string) => /(?:19|20)\d{2}/.exec(date)?.[0] ?? '';

// A saved certificate as the list and the editor work with it. Entries saved without a title are still shown, so they can
// be edited or deleted. An older entry that only has a year shows it as its issue date.
function view(item: Stored): Certification {
  const title =
    typeof item.title === 'string' && item.title.trim() ? item.title : '(Untitled certificate)';
  const cert = normaliseCertifications([{ ...item, title }])[0];
  return { ...cert, id: item.id as string | number | undefined, issueDate: cert.issueDate || cert.year };
}

// Certificates saved before private storage existed point at a picture in the public "certificates" bucket
const legacyFileName = (item: Stored | null) =>
  item && item.storageType === 'cloud' && typeof item.imageFileName === 'string'
    ? item.imageFileName
    : '';

async function deleteLegacyFile(fileName: string) {
  if (!fileName) return;
  const response = await fetch('/api/upload/certificate/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });
  if (!response.ok) throw new Error('The old picture could not be deleted');
}

const filesOf = (cert: Certification) => (cert.file ? [cert.file.path] : []);

export default function CertificationsAdmin() {
  return (
    <AdminLayout>
      <CertificationsContent />
    </AdminLayout>
  );
}

function CertificationsContent() {
  const list = useStoredList('certifications');
  const [editing, setEditing] = useState<{ draft: Certification; raw: Stored | null } | null>(null);
  const ops = useListOps({
    list,
    flag: 'visible',
    noun: 'certificate',
    titleOf: (item) => view(item).title,
    filesOf: (item) => filesOf(view(item)),
    afterRemove: (item) => deleteLegacyFile(legacyFileName(item)),
  });

  // the live preview shows what is saved
  useDraftSync('certifications', list.items, !list.loading && !list.loadError);

  if (list.loadError) return <AdminLoadError message={list.loadError} />;
  if (list.loading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading certificates"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const certificates = list.items;

  const edit = (item: Stored) => {
    const draft = view(item);
    if (typeof item.title !== 'string' || !item.title.trim()) draft.title = '';
    setEditing({ draft, raw: item });
  };
  if (editing) {
    return (
      <CertificateEditor
        key={String(editing.draft.id)}
        initial={editing.draft}
        raw={editing.raw}
        apply={list.apply}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={Award}
          title="Certificates"
          subtitle="Upload each certificate as a picture or PDF, add its details, and choose whether it is shown"
        />
        <button
          type="button"
          onClick={() => setEditing({ draft: blank(), raw: null })}
          className={primaryButtonClass}
        >
          <Plus size={16} aria-hidden="true" />
          Add a certificate
        </button>
      </div>

      {certificates.length === 0 && (
        <Panel>
          <p className="text-sm text-gray-600">
            No certificates yet. Select &quot;Add a certificate&quot; to add your first one.
          </p>
        </Panel>
      )}

      <ul className="space-y-4">
        {certificates.map((item, index) => {
          const cert = view(item);
          const published = ops.isPublished(item);
          return (
            <li
              key={idOf(item) || index}
              className={`rounded-xl border p-4 shadow-sm sm:p-5 ${published ? 'border-gray-200 bg-white' : 'border-amber-300 bg-amber-50/50'}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {cert.file ? (
                  <FileThumb file={cert.file} className="h-24 w-36" />
                ) : cert.imageUrl && isPdfUrl(cert.imageUrl) ? (
                  <span className="flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                    <FileText size={22} aria-hidden="true" />
                    <span className="text-[11px] font-semibold">PDF</span>
                  </span>
                ) : cert.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cert.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-24 w-36 shrink-0 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold break-words text-gray-900">{cert.title}</h2>
                    <StatusBadge published={published} />
                    {cert.issueDate && <span className="text-sm text-gray-500">{cert.issueDate}</span>}
                  </div>
                  {cert.issuer && <p className="text-sm font-medium text-purple-700">{cert.issuer}</p>}
                  {cert.credentialId && (
                    <p className="mt-0.5 font-mono text-xs break-all text-gray-600">
                      ID: {cert.credentialId}
                    </p>
                  )}
                  {cert.skills && cert.skills.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skills">
                      {cert.skills.map((skill) => (
                        <li
                          key={skill}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!cert.file && !cert.imageUrl && (
                    <p className="mt-2 text-xs text-amber-800">No picture or PDF attached yet.</p>
                  )}
                </div>
                <RowActions
                  name={cert.title}
                  index={index}
                  count={certificates.length}
                  published={published}
                  busy={ops.busyId === idOf(item)}
                  onMove={(direction) => ops.move(index, direction)}
                  onToggle={() => ops.toggle(item)}
                  onEdit={() => edit(item)}
                  onDelete={() => ops.remove(item)}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className={hintClass}>
        The order here is the order on your site. A certificate that is not published, and its
        file, cannot be seen by visitors.
      </p>
    </div>
  );
}

interface EditorProps {
  initial: Certification;
  raw: Stored | null;
  apply: (change: (latest: Stored[]) => Stored[]) => Promise<Stored[] | null>;
  onClose: () => void;
}

function CertificateEditor({ initial, raw, apply, onClose }: EditorProps) {
  const notify = useNotify();
  const { draft, set, dirty, saved, markSaved, close, ledger } = useEditor<Certification>({
    initial,
    exists: Boolean(raw),
    filesOf,
    onClose,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const published = draft.visible !== false;

  const validate = (): Record<string, string> => {
    const problems: Record<string, string> = {};
    if (!draft.title.trim()) problems.title = 'Give the certificate a title.';
    if (draft.verificationUrl?.trim() && !toWebUrl(draft.verificationUrl)) {
      problems.verificationUrl =
        'This does not look like a web address, for example https://www.credly.com/badges/your-badge.';
    }
    return problems;
  };

  // `publish` sets whether the certificate is shown; leaving it out keeps the choice made in the form
  const save = async (publish?: boolean) => {
    const problems = validate();
    setErrors(problems);
    const firstProblem = Object.keys(problems)[0];
    if (firstProblem) {
      requestAnimationFrame(() => document.getElementById(`cert-${firstProblem}`)?.focus());
      notify.error('Some details need your attention. They are marked in red.');
      return;
    }

    const snapshot: Certification = { ...draft, visible: publish ?? draft.visible !== false };
    const issueDate = (snapshot.issueDate ?? '').trim();
    // the old picture (a web address) is dropped when a file is uploaded or when it was removed
    const keepLegacy = !snapshot.file && Boolean(toWebUrl(snapshot.imageUrl));
    const clean: Stored = {
      id: snapshot.id,
      title: snapshot.title.trim(),
      issuer: snapshot.issuer.trim(),
      issueDate,
      // the year is read from the issue date, because the timeline and the resume use it
      year: yearOf(issueDate),
      credentialId: (snapshot.credentialId ?? '').trim(),
      description: (snapshot.description ?? '').trim(),
      skills: snapshot.skills ?? [],
      verificationUrl: toWebUrl(snapshot.verificationUrl),
      file: snapshot.file,
      visible: snapshot.visible !== false,
      imageUrl: keepLegacy ? toWebUrl(snapshot.imageUrl) : '',
      ...(keepLegacy ? {} : { imageFileName: undefined, storageType: undefined }),
    };

    setSaving(true);
    const result = await apply((latest) => {
      const index = latest.findIndex((entry) => idOf(entry) === String(snapshot.id));
      if (index >= 0) {
        const next = [...latest];
        next[index] = { ...latest[index], ...clean };
        return next;
      }
      return [...latest, { ...(raw ?? {}), ...clean }];
    });
    setSaving(false);

    if (!result) {
      notify.error(
        'Your changes could not be saved. Nothing is lost: it is all still on this page. Please try again.'
      );
      return;
    }
    set('visible', snapshot.visible);
    await markSaved(snapshot);
    // an older picture in the public bucket that this save dropped is deleted too
    const old = legacyFileName(raw);
    if (old && !keepLegacy) {
      try {
        await deleteLegacyFile(old);
      } catch {
        notify.info(
          'Your changes are saved, but the old picture could not be removed from storage. It does no harm.'
        );
      }
    }
    notify.success(
      snapshot.visible !== false
        ? 'Saved. This certificate is shown on your site.'
        : 'Saved as a draft. Visitors cannot see it yet.'
    );
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        icon={Award}
        title={saved.exists ? `Edit: ${initial.title || 'certificate'}` : 'New certificate'}
        subtitle="Only published certificates, and their files, can be seen by visitors."
      />

      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          Please fix: {Object.values(errors).join(' ')}
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        <Panel title="About the certificate">
          <div>
            <label htmlFor="cert-title" className={labelClass}>
              Title *
            </label>
            <input
              id="cert-title"
              type="text"
              value={draft.title}
              maxLength={160}
              onChange={(e) => set('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'err-cert-title' : undefined}
              className={inputClass}
              placeholder="Machine Learning Specialization"
            />
            <FieldError id="err-cert-title" message={errors.title} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cert-issuer" className={labelClass}>
                Issued by
              </label>
              <input
                id="cert-issuer"
                type="text"
                value={draft.issuer}
                maxLength={120}
                onChange={(e) => set('issuer', e.target.value)}
                className={inputClass}
                placeholder="Coursera, Google, a university..."
              />
            </div>
            <div>
              <label htmlFor="cert-issueDate" className={labelClass}>
                Issue date
              </label>
              <input
                id="cert-issueDate"
                type="text"
                value={draft.issueDate ?? ''}
                maxLength={40}
                onChange={(e) => set('issueDate', e.target.value)}
                className={inputClass}
                placeholder="March 2025"
              />
              <p className={hintClass}>
                Shown as you type it. Include the year so it can appear on the timeline.
              </p>
            </div>
            <div>
              <label htmlFor="cert-credentialId" className={labelClass}>
                Credential ID
              </label>
              <input
                id="cert-credentialId"
                type="text"
                value={draft.credentialId ?? ''}
                maxLength={120}
                onChange={(e) => set('credentialId', e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="cert-verificationUrl" className={labelClass}>
                Verification link
              </label>
              <input
                id="cert-verificationUrl"
                type="text"
                value={draft.verificationUrl ?? ''}
                onChange={(e) => set('verificationUrl', e.target.value)}
                aria-invalid={Boolean(errors.verificationUrl)}
                aria-describedby={errors.verificationUrl ? 'err-cert-verificationUrl' : undefined}
                className={inputClass}
                placeholder="https://..."
              />
              <FieldError id="err-cert-verificationUrl" message={errors.verificationUrl} />
              <p className={hintClass}>Where a visitor can check that the certificate is real.</p>
            </div>
          </div>
        </Panel>

        <Panel
          title="The certificate itself"
          description="A picture or a PDF. It is kept private and shown to visitors only while this certificate is published."
        >
          <SingleFileEditor
            file={draft.file}
            onChange={(file) => set('file', file)}
            kind="certificate"
            ledger={ledger}
            label="Picture or PDF"
            legacyImageUrl={draft.imageUrl}
            onRemoveLegacy={() => set('imageUrl', '')}
          />
        </Panel>

        <Panel title="Details">
          <MarkdownEditor
            id="cert-description"
            label="What it covers"
            hint="Optional. Say what you learned or what the certificate shows."
            value={draft.description ?? ''}
            onChange={(value) => set('description', value)}
            rows={5}
            maxLength={DESCRIPTION_LIMIT}
          />
          <TagsInput
            id="cert-skills"
            label="Skills"
            hint="Separate with commas. They are shown on the certificate and feed the skill explorer."
            value={draft.skills ?? []}
            onChange={(value) => set('skills', value)}
            placeholder="Python, Statistics"
          />
        </Panel>

        <Panel title="Publishing">
          <Toggle
            checked={published}
            onChange={(value) => set('visible', value)}
            label="Show on my site"
            description={
              published
                ? 'Visitors can see this certificate and open its file.'
                : 'A draft: only you can see it, and its file stays private.'
            }
          />
        </Panel>
      </div>

      <EditorBar published={published} saving={saving} dirty={dirty} onSave={save} onClose={close} />
    </div>
  );
}
