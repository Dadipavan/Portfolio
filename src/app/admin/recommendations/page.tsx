'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Quote, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import {
  PageHeader,
  Panel,
  SaveBar,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
} from '@/components/admin/kit';
import { getPortfolioDataForEditing, updatePortfolioSection } from '@/lib/dataManager';
import { normaliseRecommendations } from '@/lib/normalize';
import { useDraftSync } from '@/lib/previewBus';
import type { Recommendation } from '@/lib/types';

type Draft = Omit<Recommendation, 'id'> & { id: string | number };

export default function RecommendationsAdmin() {
  const [items, setItems] = useState<Draft[]>([]);
  const [savedJson, setSavedJson] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPortfolioDataForEditing()
      .then((data) => {
        const list = normaliseRecommendations(data.recommendations);
        setItems(list);
        setSavedJson(JSON.stringify(list));
      })
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  // the live preview shows the edits before they are saved
  useDraftSync('recommendations', items, !loading && !loadError);

  const dirty = !loading && JSON.stringify(items) !== savedJson;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const incomplete = useMemo(
    () => items.filter((item) => !item.name.trim() || !item.quote.trim()).length,
    [items]
  );

  const patch = (index: number, change: Partial<Draft>) => {
    setStatus(null);
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...change } : item)));
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const cleaned = items
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        role: (item.role ?? '').trim(),
        relation: (item.relation ?? '').trim(),
        quote: item.quote.trim(),
        link: (item.link ?? '').trim(),
      }))
      .filter((item) => item.name && item.quote);
    const ok = await updatePortfolioSection('recommendations', cleaned);
    setSaving(false);
    if (ok) {
      const normalised = normaliseRecommendations(cleaned);
      setItems(normalised);
      setSavedJson(JSON.stringify(normalised));
      setStatus({ type: 'success', text: 'Saved. Your site has been updated.' });
    } else {
      setStatus({ type: 'error', text: 'Could not save the changes. Please try again.' });
    }
  };

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

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-4">
        <PageHeader
          icon={Quote}
          title="Recommendations"
          subtitle="Words from mentors, managers and teammates"
        />

        <Panel>
          <p className="text-sm text-gray-600">
            Add only genuine quotes that the person has agreed to share. The recommendations wall
            appears on your site as soon as you save one, and disappears while the list is empty. An
            entry needs a name and a quote.
          </p>
        </Panel>

        {items.length === 0 && (
          <Panel>
            <p className="text-sm text-gray-600">No recommendations yet.</p>
          </Panel>
        )}

        <ul className="space-y-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate font-semibold text-gray-900">
                  {item.name.trim() || `Recommendation ${index + 1}`}
                </h2>
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className={`${buttonClass} !px-2`}
                    aria-label="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className={`${buttonClass} !px-2`}
                    aria-label="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.confirm(
                        'Remove this recommendation? It is removed from your site when you press Save.'
                      ) && setItems((current) => current.filter((_, i) => i !== index))
                    }
                    className={`${buttonClass} !px-2 text-red-600`}
                    aria-label="Remove this recommendation"
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor={`rec-name-${index}`} className={labelClass}>
                    Name
                  </label>
                  <input
                    id={`rec-name-${index}`}
                    type="text"
                    maxLength={80}
                    value={item.name}
                    onChange={(e) => patch(index, { name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`rec-role-${index}`} className={labelClass}>
                    Their role
                  </label>
                  <input
                    id={`rec-role-${index}`}
                    type="text"
                    maxLength={80}
                    value={item.role ?? ''}
                    onChange={(e) => patch(index, { role: e.target.value })}
                    className={inputClass}
                    placeholder="Senior Data Engineer"
                  />
                </div>
                <div>
                  <label htmlFor={`rec-relation-${index}`} className={labelClass}>
                    How we know each other
                  </label>
                  <input
                    id={`rec-relation-${index}`}
                    type="text"
                    maxLength={60}
                    value={item.relation ?? ''}
                    onChange={(e) => patch(index, { relation: e.target.value })}
                    className={inputClass}
                    placeholder="Mentor"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`rec-quote-${index}`} className={labelClass}>
                  Quote
                </label>
                <textarea
                  id={`rec-quote-${index}`}
                  rows={4}
                  maxLength={1200}
                  value={item.quote}
                  onChange={(e) => patch(index, { quote: e.target.value })}
                  className={`${inputClass} resize-y`}
                />
              </div>
              <div>
                <label htmlFor={`rec-link-${index}`} className={labelClass}>
                  Link to the original (optional)
                </label>
                <input
                  id={`rec-link-${index}`}
                  type="url"
                  value={item.link ?? ''}
                  onChange={(e) => patch(index, { link: e.target.value })}
                  className={inputClass}
                  placeholder="https://www.linkedin.com/..."
                />
                <p className={hintClass}>
                  For example the LinkedIn recommendation, so visitors can check it.
                </p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            setStatus(null);
            setItems((current) => [
              ...current,
              { id: `rec-${Date.now()}`, name: '', role: '', relation: '', quote: '', link: '' },
            ]);
          }}
          className={buttonClass}
        >
          <Plus size={16} aria-hidden="true" />
          Add a recommendation
        </button>
        {incomplete > 0 && (
          <p className="text-sm text-amber-700">
            {incomplete} entr{incomplete === 1 ? 'y has' : 'ies have'} no name or no quote and will
            be left out when you save.
          </p>
        )}
      </div>
      <SaveBar onSave={save} saving={saving} dirty={dirty} status={status} />
    </AdminLayout>
  );
}
