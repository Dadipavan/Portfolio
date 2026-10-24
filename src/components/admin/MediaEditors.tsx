'use client';

import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, FileText, Trash2, UploadCloud, X } from 'lucide-react';
import {
  UPLOAD_RULES,
  formatBytes,
  isPdf,
  isPdfUrl,
  mediaUrl,
  type UploadKind,
} from '@/lib/media';
import type { MediaFile, MediaKind } from '@/lib/types';
import { useConfirm } from './Feedback';
import { buttonClass, hintClass, inputClass, labelClass } from './kit';
import type { FileLedger } from './useFileLedger';
import { useUploads, type UploadingItem } from './useUploads';

export function FileThumb({
  file,
  className = 'h-20 w-28',
}: {
  file: MediaFile;
  className?: string;
}) {
  if (isPdf(file)) {
    return (
      <span
        className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 ${className}`}
      >
        <FileText size={22} aria-hidden="true" />
        <span className="text-[11px] font-semibold">PDF</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(file.path)}
      alt=""
      loading="lazy"
      className={`shrink-0 rounded-lg border border-gray-200 bg-gray-50 object-cover ${className}`}
    />
  );
}

export function UploadProgressList({
  items,
  onDismiss,
}: {
  items: UploadingItem[];
  onDismiss: (key: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2" aria-label="Uploads">
      {items.map((item) => (
        <li key={item.key} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-gray-800">{item.name}</span>
            {item.error ? (
              <button
                type="button"
                onClick={() => onDismiss(item.key)}
                className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label={`Dismiss the failed upload of ${item.name}`}
              >
                <X size={16} />
              </button>
            ) : (
              <span className="shrink-0 text-gray-600 tabular-nums">{item.progress}%</span>
            )}
          </div>
          {item.error ? (
            <p role="alert" className="mt-1 text-red-700">
              {item.error}
            </p>
          ) : (
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-label={`Uploading ${item.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.progress}
            >
              <div
                className="h-full rounded-full bg-purple-600 transition-[width]"
                style={{ width: `${Math.max(4, item.progress)}%` }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// A box to drop files on, or select to choose them
export function DropZone({
  onFiles,
  accept,
  multiple = true,
  disabled = false,
  title,
  help,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  title: string;
  help: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
    if (input.current) input.current.value = '';
  };

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (!disabled) take(event.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-purple-500 ${
        over ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <UploadCloud size={26} className="text-purple-600" aria-hidden="true" />
      <span className="text-sm font-medium text-gray-900">{title}</span>
      <span className="text-xs text-gray-500">{help}</span>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => take(event.target.files)}
        className="sr-only"
      />
    </label>
  );
}

const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';
const ACCEPT_DOCUMENTS = `${ACCEPT_IMAGES},application/pdf`;

interface KindOption {
  value: MediaKind;
  label: string;
}

// A gallery of uploaded pictures (or documents) with captions, order and removal
export function MediaListEditor({
  items,
  onChange,
  kind,
  ledger,
  label,
  help,
  kinds,
  max = 24,
}: {
  items: MediaFile[];
  onChange: (items: MediaFile[]) => void;
  kind: UploadKind;
  ledger: FileLedger;
  label: string;
  help?: string;
  kinds?: KindOption[];
  max?: number;
}) {
  const { uploading, upload, dismiss, busy } = useUploads(kind, ledger);
  const confirm = useConfirm();
  const documents = UPLOAD_RULES[kind].types.includes('application/pdf');

  const add = async (files: File[]) => {
    const room = Math.max(0, max - items.length);
    const done = await upload(files.slice(0, room));
    if (done.length > 0) {
      onChange([
        ...items,
        ...done.map((file) => ({ ...file, kind: kinds ? kinds[0].value : undefined })),
      ]);
    }
  };

  const patch = (id: string, change: Partial<MediaFile>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const remove = async (file: MediaFile) => {
    const ok = await confirm({
      title: 'Remove this file?',
      message: `"${file.caption || file.name}" is removed from this item when you save. The file is deleted from storage after saving.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    ledger.touch(file.path);
    onChange(items.filter((item) => item.id !== file.id));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>{label}</p>
        {help && <p className={`${hintClass} mb-2`}>{help}</p>}
        <DropZone
          onFiles={add}
          accept={documents ? ACCEPT_DOCUMENTS : ACCEPT_IMAGES}
          disabled={items.length >= max}
          title={
            items.length >= max
              ? `You have reached the limit of ${max} files`
              : 'Drop files here, or select to choose them'
          }
          help={`${UPLOAD_RULES[kind].label}. Pictures are made web-sized for you.`}
        />
      </div>

      <UploadProgressList items={uploading} onDismiss={dismiss} />
      {busy && (
        <p className="sr-only" role="status">
          Uploading
        </p>
      )}

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((file, index) => (
            <li
              key={file.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row"
            >
              <FileThumb file={file} className="h-28 w-full sm:w-40" />
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <label
                    htmlFor={`caption-${file.id}`}
                    className="text-xs font-medium text-gray-600"
                  >
                    Caption (shown under the picture)
                  </label>
                  <input
                    id={`caption-${file.id}`}
                    type="text"
                    maxLength={200}
                    value={file.caption ?? ''}
                    onChange={(event) => patch(file.id, { caption: event.target.value })}
                    className={`${inputClass} !py-1.5 text-sm`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {!isPdf(file) && (
                    <div>
                      <label
                        htmlFor={`alt-${file.id}`}
                        className="text-xs font-medium text-gray-600"
                      >
                        Describe it for people who cannot see it
                      </label>
                      <input
                        id={`alt-${file.id}`}
                        type="text"
                        maxLength={200}
                        value={file.alt ?? ''}
                        onChange={(event) => patch(file.id, { alt: event.target.value })}
                        className={`${inputClass} !py-1.5 text-sm`}
                      />
                    </div>
                  )}
                  {kinds && (
                    <div>
                      <label
                        htmlFor={`kind-${file.id}`}
                        className="text-xs font-medium text-gray-600"
                      >
                        What it shows
                      </label>
                      <select
                        id={`kind-${file.id}`}
                        value={file.kind ?? kinds[0].value}
                        onChange={(event) =>
                          patch(file.id, { kind: event.target.value as MediaKind })
                        }
                        className={`${inputClass} !py-1.5 text-sm`}
                      >
                        {kinds.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {file.name} · {formatBytes(file.size)}
                  {file.width && file.height ? ` · ${file.width}×${file.height}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1 sm:flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className={`${buttonClass} !px-2`}
                  aria-label={`Move ${file.name} earlier`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className={`${buttonClass} !px-2`}
                  aria-label={`Move ${file.name} later`}
                >
                  <ArrowDown size={16} />
                </button>
                <a
                  href={mediaUrl(file.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonClass} !px-2`}
                  aria-label={`Open ${file.name} in a new tab`}
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => remove(file)}
                  className={`${buttonClass} !px-2 text-red-600`}
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// One file (a certificate image or PDF, a profile photo): shows it, and lets the admin replace or remove it
export function SingleFileEditor({
  file,
  onChange,
  kind,
  ledger,
  label,
  help,
  legacyImageUrl,
  onRemoveLegacy,
}: {
  file: MediaFile | undefined;
  onChange: (file: MediaFile | undefined) => void;
  kind: UploadKind;
  ledger: FileLedger;
  label: string;
  help?: string;
  // an older picture kept as a web address (shown until it is replaced)
  legacyImageUrl?: string;
  onRemoveLegacy?: () => void;
}) {
  const { uploading, upload, dismiss } = useUploads(kind, ledger);
  const confirm = useConfirm();
  const documents = UPLOAD_RULES[kind].types.includes('application/pdf');

  const choose = async (files: File[]) => {
    const [done] = await upload(files.slice(0, 1));
    if (done) {
      if (file) ledger.touch(file.path);
      onChange(done);
    }
  };

  const remove = async () => {
    if (!file) return;
    const ok = await confirm({
      title: 'Remove this file?',
      message: `"${file.name}" is removed when you save, and deleted from storage after saving.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    ledger.touch(file.path);
    onChange(undefined);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className={labelClass}>{label}</p>
        {help && <p className={`${hintClass} mb-2`}>{help}</p>}
      </div>

      {file && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center">
          <FileThumb file={file} className="h-32 w-full sm:w-44" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">
              {isPdf(file) ? 'PDF document' : 'Picture'} · {formatBytes(file.size)}
              {file.width && file.height ? ` · ${file.width}×${file.height}` : ''}
            </p>
            <a
              href={mediaUrl(file.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Open it to check
            </a>
          </div>
          <button type="button" onClick={remove} className={`${buttonClass} text-red-600`}>
            <Trash2 size={16} aria-hidden="true" />
            Remove
          </button>
        </div>
      )}

      {!file && legacyImageUrl && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm sm:flex-row sm:items-center">
          {isPdfUrl(legacyImageUrl) ? (
            <a
              href={legacyImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-amber-200 bg-white text-gray-600 hover:bg-gray-50"
            >
              <FileText size={22} aria-hidden="true" />
              <span className="text-[11px] font-semibold">PDF: open it</span>
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={legacyImageUrl}
              alt=""
              className="h-24 w-36 rounded-lg border border-amber-200 bg-white object-cover"
            />
          )}
          <p className="min-w-0 flex-1 text-amber-900">
            This file was added earlier and is stored in a public place. Upload a new file to keep it
            private and under your control, or remove it.
          </p>
          {onRemoveLegacy && (
            <button
              type="button"
              onClick={onRemoveLegacy}
              className={`${buttonClass} text-red-600`}
            >
              Remove
            </button>
          )}
        </div>
      )}

      <DropZone
        onFiles={choose}
        accept={documents ? ACCEPT_DOCUMENTS : ACCEPT_IMAGES}
        multiple={false}
        title={
          file
            ? 'Drop a new file here to replace it, or select to choose one'
            : 'Drop a file here, or select to choose one'
        }
        help={`${UPLOAD_RULES[kind].label}.`}
      />
      <UploadProgressList items={uploading} onDismiss={dismiss} />
    </div>
  );
}
