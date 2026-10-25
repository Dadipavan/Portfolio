'use client';

// Resume builder: paste a job description, see which keywords it asks for, tick what from the portfolio goes
// into the resume, check the live preview, then download the PDF or save it with the other resumes.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  Download,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { getPortfolioDataForEditing, type Resume } from '@/lib/dataManager';
import { ResumeManager } from '@/lib/resumeManager';
import { mergeSiteSettings } from '@/lib/siteSettings';
import type { RoleDef } from '@/lib/types';
import { coverage, extractKeywords, type Keyword } from '@/lib/resume/keywords';
import {
  buildPdf,
  layoutBlocks,
  type Density,
  type PageSize,
  type PdfOptions,
} from '@/lib/resume/pdf';
import {
  DEFAULT_ORDER,
  SECTION_TITLES,
  autoSelect,
  blocksText,
  buildBlocks,
  draftSummary,
  type BuilderItems,
  type PickItem,
  type SectionKey,
  type SkillPick,
  type SourceData,
} from '@/lib/resume/source';
import { isRecipe, pdfFileName, type ResumeRecipe } from '@/lib/resume/recipe';
import { runChecks } from '@/lib/resume/checks';
import { useConfirm, useNotify } from '@/components/admin/Feedback';
import { Panel, buttonClass, inputClass, labelClass, primaryButtonClass } from '@/components/admin/kit';

const DRAFT_KEY = 'resume_builder_draft_v1';

type ListSection = 'experience' | 'projects' | 'education' | 'certifications' | 'achievements';

interface Props {
  // a resume made earlier in the builder, opened for editing
  initialRecipe?: ResumeRecipe | null;
  onClose: () => void;
  // called after a resume was saved to the list
  onSaved: () => void;
}

// ---------- the preview: the exact pages that the PDF will have ----------

function PagePreview({ pages, pageWidth, pageHeight }: ReturnType<typeof layoutBlocks>) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.max(0.4, Math.min(1.4, (el.clientWidth - 2) / pageWidth)));
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageWidth]);

  return (
    <div ref={box} className="w-full space-y-4">
      {pages.map((lines, n) => (
        <div
          key={n}
          className="relative mx-auto overflow-hidden bg-white shadow-md ring-1 ring-gray-200"
          style={{ width: pageWidth * scale, height: pageHeight * scale }}
          aria-label={`Resume page ${n + 1}`}
        >
          {lines.map((line, i) => (
            <div key={i}>
              {line.pieces.map((p, j) => (
                <span
                  key={j}
                  className="absolute whitespace-pre text-black"
                  style={{
                    left: p.x * scale,
                    top: (line.y - p.size * 0.8465) * scale,
                    fontSize: p.size * scale,
                    lineHeight: 1,
                    fontWeight: p.bold ? 700 : 400,
                    fontFamily: 'Helvetica, Arial, "Liberation Sans", sans-serif',
                  }}
                >
                  {p.text}
                </span>
              ))}
              {line.rule && (
                <div
                  className="absolute bg-gray-500"
                  style={{
                    left: line.rule.x1 * scale,
                    width: (line.rule.x2 - line.rule.x1) * scale,
                    top: line.rule.y * scale,
                    height: Math.max(1, 0.4 * scale),
                  }}
                />
              )}
            </div>
          ))}
          <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">
            {n + 1} / {pages.length}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- the pick lists ----------

function ItemGroup({
  title,
  list,
  help,
  onChange,
}: {
  title: string;
  list: PickItem[];
  help?: string;
  onChange: (next: PickItem[]) => void;
}) {
  if (!list.length) return null;
  const patch = (i: number, change: Partial<PickItem>) =>
    onChange(list.map((it, k) => (k === i ? { ...it, ...change } : it)));
  const single = list.every((it) => it.lines.length <= 1 && !it.sub && !it.right);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <span className="text-xs text-gray-500">
          {list.filter((x) => x.on).length} of {list.length} in the resume
        </span>
      </div>
      {help && <p className="text-xs text-gray-500">{help}</p>}
      <ul className="space-y-2">
        {list.map((it, i) => (
          <li key={it.key} className={`rounded-lg border p-3 ${it.on ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200 bg-white'}`}>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-purple-600"
                checked={it.on}
                onChange={(e) => patch(i, { on: e.target.checked })}
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium text-gray-900">{it.left}</span>
                {!single && (it.sub || it.right) && (
                  <span className="block break-words text-xs text-gray-500">{[it.sub, it.right].filter(Boolean).join('  ·  ')}</span>
                )}
              </span>
              {it.score > 0 && (
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700" title="How strongly this matches the job description">
                  match {Math.round(it.score * 10) / 10}
                </span>
              )}
            </label>
            {it.on && !single && it.lines.length > 0 && (
              <ul className="mt-2 space-y-1.5 pl-6">
                {it.lines.map((l, k) => (
                  <li key={k} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      aria-label="Include this line"
                      className="mt-2 h-4 w-4 shrink-0 accent-purple-600"
                      checked={l.on}
                      onChange={(e) =>
                        patch(i, { lines: it.lines.map((x, y) => (y === k ? { ...x, on: e.target.checked } : x)) })
                      }
                    />
                    <textarea
                      rows={Math.min(4, Math.max(1, Math.ceil(l.text.length / 70)))}
                      value={l.text}
                      aria-label="Line text (changes only this resume)"
                      onChange={(e) =>
                        patch(i, { lines: it.lines.map((x, y) => (y === k ? { ...x, text: e.target.value } : x)) })
                      }
                      className={`w-full resize-none rounded-md border px-2 py-1 text-sm ${
                        l.on ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                    />
                    {l.score > 0 && <span className="mt-1.5 text-xs text-green-700">+{Math.round(l.score * 10) / 10}</span>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillsGroup({ skills, onChange }: { skills: SkillPick[]; onChange: (next: SkillPick[]) => void }) {
  if (!skills.length) return null;
  const patch = (i: number, change: Partial<SkillPick>) =>
    onChange(skills.map((c, k) => (k === i ? { ...c, ...change } : c)));
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">Skills</h4>
      <p className="text-xs text-gray-500">Green skills appear in the job description. Click a skill to remove it from, or add it back to, the resume.</p>
      <ul className="space-y-2">
        {skills.map((c, i) => (
          <li key={c.category} className={`rounded-lg border p-3 ${c.on ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200'}`}>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
              <input type="checkbox" className="h-4 w-4 accent-purple-600" checked={c.on} onChange={(e) => patch(i, { on: e.target.checked })} />
              {c.category}
            </label>
            {c.on && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.skills.map((s, k) => (
                  <button
                    key={s.name}
                    type="button"
                    aria-pressed={s.on}
                    onClick={() => patch(i, { skills: c.skills.map((x, y) => (y === k ? { ...x, on: !x.on } : x)) })}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      !s.on
                        ? 'border-gray-200 bg-gray-50 text-gray-400 line-through'
                        : s.hit
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- the builder ----------

export default function ResumeBuilder({ initialRecipe, onClose, onSaved }: Props) {
  const notify = useNotify();
  const confirm = useConfirm();

  const [data, setData] = useState<SourceData | null>(null);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loadError, setLoadError] = useState('');

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [items, setItems] = useState<BuilderItems | null>(null);
  const [order, setOrder] = useState<SectionKey[]>(DEFAULT_ORDER);
  const [options, setOptions] = useState<Pick<PdfOptions, 'pageSize' | 'fontSize' | 'density'>>({
    pageSize: 'letter',
    fontSize: 10.5,
    density: 'normal',
  });
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const restored = useRef(false);

  // the words the owner already uses for skills, so the JD scan recognises them
  const vocabulary = useMemo(() => {
    if (!data) return [];
    return [
      ...data.technicalSkills.flatMap((c) => c.skills ?? []),
      ...data.projects.flatMap((p) => [...(p.technologies ?? []), ...(p.tools ?? [])]),
    ];
  }, [data]);

  // load the portfolio content (read only)
  useEffect(() => {
    let alive = true;
    // the strict loader: a resume must never be built from cached or built-in sample content
    getPortfolioDataForEditing()
      .then((d) => {
        if (!alive) return;
        setData({
          personalInfo: d.personalInfo,
          technicalSkills: d.technicalSkills as SourceData['technicalSkills'],
          experience: d.experience as SourceData['experience'],
          projects: d.projects,
          education: d.education as SourceData['education'],
          certifications: d.certifications,
          achievements: d.achievements,
        });
        setRoles(mergeSiteSettings(d.siteSettings).roles);
      })
      .catch(() => alive && setLoadError('The portfolio content could not be loaded. Refresh the page and try again.'));
    return () => {
      alive = false;
    };
  }, []);

  // restore a saved resume, or the unfinished draft from this browser
  useEffect(() => {
    if (!data || restored.current) return;
    restored.current = true;
    let source: Partial<ResumeRecipe> | null = initialRecipe && isRecipe(initialRecipe) ? initialRecipe : null;
    let fromDraft = false;
    if (!source) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && isRecipe(parsed)) {
          source = parsed;
          fromDraft = true;
        }
      } catch {
        /* an unreadable draft is ignored */
      }
    }
    if (!source || !source.items) return;
    setJobTitle(source.jobTitle ?? '');
    setCompany(source.company ?? '');
    setJd(source.jd ?? '');
    setItems(source.items);
    setOrder(source.order ?? DEFAULT_ORDER);
    if (source.options) setOptions(source.options);
    setKeywords(extractKeywords(source.jd ?? '', vocabulary));
    if (fromDraft) notify.info('Your unfinished resume was restored.');
  }, [data, initialRecipe, vocabulary, notify]);

  // keep an unfinished draft in this browser
  useEffect(() => {
    if (!items) return;
    const t = setTimeout(() => {
      try {
        const draft: ResumeRecipe = { version: 1, jobTitle, company, jd, items, order, options, savedAt: new Date().toISOString() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full or blocked: the draft is simply not kept */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [items, jobTitle, company, jd, order, options]);

  const pdfOptions: PdfOptions = useMemo(
    () => ({ ...options, title: `${data?.personalInfo?.name ?? 'Resume'}${jobTitle ? ` - ${jobTitle}` : ''}`, author: data?.personalInfo?.name ?? '' }),
    [options, data, jobTitle]
  );

  const blocks = useMemo(
    () => (data && items ? buildBlocks(data.personalInfo, items, order, data.personalInfo.links ?? []) : []),
    [data, items, order]
  );
  const laid = useMemo(() => layoutBlocks(blocks, pdfOptions), [blocks, pdfOptions]);
  const cov = useMemo(() => coverage(blocksText(blocks), keywords), [blocks, keywords]);
  const checks = useMemo(
    () => (data && items ? runChecks(data.personalInfo, blocks, laid.pages.length) : []),
    [data, items, blocks, laid.pages.length]
  );

  const analyse = async () => {
    if (!data) return;
    if (items && !(await confirm({ title: 'Choose again?', message: 'This re-selects items for the new job description and replaces your current ticks and edited lines.', confirmLabel: 'Re-select' }))) return;
    const kw = extractKeywords(jd, vocabulary);
    setKeywords(kw);
    const next = autoSelect(data, kw, jobTitle);
    setItems(next);
    setOrder(DEFAULT_ORDER);
    if (!jd.trim()) notify.info('No job description: everything from your portfolio is offered, nothing is ranked.');
    else if (!kw.length) notify.info('No keywords were found. Paste more of the job description.');
    else notify.success(`${kw.length} keywords found. The best matches are ticked: check them in the preview.`);
  };

  const startOver = async () => {
    if (!(await confirm({ title: 'Start over?', message: 'The job description, ticks and edited lines of this unfinished resume are cleared. Saved resumes are not affected.', confirmLabel: 'Start over', danger: true }))) return;
    setItems(null);
    setJd('');
    setJobTitle('');
    setCompany('');
    setKeywords([]);
    setOrder(DEFAULT_ORDER);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to clear */
    }
  };

  const setList = (section: ListSection, next: PickItem[]) => setItems((cur) => (cur ? { ...cur, [section]: next } : cur));

  const move = (i: number, d: -1 | 1) =>
    setOrder((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const copy = [...cur];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  // a keyword the owner really has can be added to the skills with one click
  const addSkill = (term: string) =>
    setItems((cur) => {
      if (!cur) return cur;
      const label = term.replace(/\b\w/g, (c) => c.toUpperCase());
      const extra = cur.skills.find((c) => c.category === 'Additional');
      const entry = { name: label, on: true, hit: true };
      const skills = extra
        ? cur.skills.map((c) => (c === extra ? { ...c, on: true, skills: [...c.skills, entry] } : c))
        : [...cur.skills, { category: 'Additional', on: true, skills: [entry] }];
      return { ...cur, skills };
    });

  const makeFile = () => {
    const bytes = buildPdf(blocks, pdfOptions);
    const fileName = pdfFileName(data?.personalInfo?.name ?? 'Resume', company || jobTitle);
    return { bytes, fileName };
  };

  const download = () => {
    if (!blocks.length) return;
    const { bytes, fileName } = makeFile();
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const save = async () => {
    if (!data || !items || !blocks.length) return;
    const label = name.trim() || [data.personalInfo.name, jobTitle || company].filter(Boolean).join(' - ') || 'Resume';
    setSaving(true);
    try {
      const { bytes, fileName } = makeFile();
      const file = new File([new Uint8Array(bytes)], fileName, { type: 'application/pdf' });
      const description = [jobTitle && `Built for: ${jobTitle}`, company && `at ${company}`].filter(Boolean).join(' ') || 'Built in the resume builder';
      const saved: Resume = await ResumeManager.uploadResume(file, label, description);
      const recipe: ResumeRecipe = { version: 1, jobTitle, company, jd, items, order, options, savedAt: new Date().toISOString() };
      // keep the choices with the record so the resume can be reopened; a failure here still leaves the PDF saved
      const extras = await ResumeManager.updateResume(saved.id, role ? { builder: recipe, role } : { builder: recipe });
      if (!extras) notify.info('The PDF was saved, but its builder choices could not be stored, so it cannot be reopened here.');
      else notify.success('Saved. It is in your resume list, private until you make it public.');
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* nothing to clear */
      }
      onSaved();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Saving the resume failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <Panel>
        <p className="text-sm text-red-700">{loadError}</p>
        <button className={buttonClass} onClick={onClose}>Back to resumes</button>
      </Panel>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
      </div>
    );
  }

  const coverageColour = cov.percent >= 70 ? 'text-green-700' : cov.percent >= 40 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resume builder</h2>
          <p className="text-sm text-gray-500">Paste a job description, pick what to include, and get an ATS-friendly PDF. Your portfolio content is never changed.</p>
        </div>
        <button className={buttonClass} onClick={onClose}>
          <ArrowLeft size={16} /> Back to resumes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---- controls ---- */}
        <div className="space-y-6">
          <Panel title="1. The job" description="Paste the whole job description. Keywords are matched against your own skills and projects. Nothing is sent anywhere.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="rb-title">Job title</label>
                <input id="rb-title" className={inputClass} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Data Analyst" />
              </div>
              <div>
                <label className={labelClass} htmlFor="rb-company">Company</label>
                <input id="rb-company" className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="rb-jd">Job description</label>
              <textarea id="rb-jd" rows={8} className={inputClass} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description here" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={primaryButtonClass} onClick={analyse}>
                <Sparkles size={16} /> {items ? 'Analyse again' : 'Analyse and select'}
              </button>
              {items && (
                <button className={buttonClass} onClick={startOver}>
                  <RotateCcw size={16} /> Start over
                </button>
              )}
            </div>
          </Panel>

          {items && (
            <>
              <Panel title="2. Keywords" description="Checked against what is in the resume right now, so they update as you tick things.">
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl font-semibold ${coverageColour}`}>{keywords.length ? `${cov.percent}%` : '–'}</span>
                  <span className="text-sm text-gray-500">{keywords.length ? 'of the weighted keywords are in the resume' : 'Paste a job description and analyse to see keyword coverage.'}</span>
                </div>
                {cov.matched.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-gray-700">In your resume</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cov.matched.map((k) => (
                        <span key={k.term} className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs text-green-800">{k.term}</span>
                      ))}
                    </div>
                  </div>
                )}
                {cov.missing.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-gray-700">Not in your resume yet</p>
                    <p className="mb-1.5 text-xs text-gray-500">Only click <Plus size={10} className="inline" /> to add a skill you really have. A tick elsewhere may already cover it.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cov.missing.map((k) => (
                        <button
                          key={k.term}
                          type="button"
                          onClick={() => addSkill(k.term)}
                          title={k.known ? 'A skill: add it to your skills if it is true for you' : 'A word the job description repeats'}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-900 hover:bg-amber-100"
                        >
                          {k.term} {k.known && <Plus size={10} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              <Panel title="3. What goes in" description="Tick what to include. The best matches for the job are ticked for you. Edit a line to reword it for this resume only.">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
                    <button
                      className="text-xs text-purple-700 hover:underline"
                      onClick={() => setItems({ ...items, summary: draftSummary(data.personalInfo, items.skills, jobTitle) })}
                    >
                      Write it again from my profile
                    </button>
                  </div>
                  <textarea rows={4} className={inputClass} aria-label="Summary" value={items.summary} onChange={(e) => setItems({ ...items, summary: e.target.value })} />
                  <p className="text-xs text-gray-500">A starting point built from your profile. Make it yours, and leave it empty to drop the section.</p>
                </div>
                <SkillsGroup skills={items.skills} onChange={(skills) => setItems({ ...items, skills })} />
                <ItemGroup title="Experience" list={items.experience} help="Each line is a bullet. Lines that match the job are ticked." onChange={(l) => setList('experience', l)} />
                <ItemGroup title="Projects" list={items.projects} help="The three best matches are on. Only published projects are offered." onChange={(l) => setList('projects', l)} />
                <ItemGroup title="Education" list={items.education} onChange={(l) => setList('education', l)} />
                <ItemGroup title="Certifications" list={items.certifications} onChange={(l) => setList('certifications', l)} />
                <ItemGroup title="Achievements" list={items.achievements} onChange={(l) => setList('achievements', l)} />
              </Panel>

              <Panel title="4. Layout">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClass} htmlFor="rb-page">Paper</label>
                    <select id="rb-page" className={inputClass} value={options.pageSize} onChange={(e) => setOptions({ ...options, pageSize: e.target.value as PageSize })}>
                      <option value="letter">US Letter</option>
                      <option value="a4">A4</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="rb-size">Text size</label>
                    <select id="rb-size" className={inputClass} value={options.fontSize} onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}>
                      <option value={9.5}>Small (9.5)</option>
                      <option value={10}>Compact (10)</option>
                      <option value={10.5}>Standard (10.5)</option>
                      <option value={11}>Large (11)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="rb-density">Spacing</label>
                    <select id="rb-density" className={inputClass} value={options.density} onChange={(e) => setOptions({ ...options, density: e.target.value as Density })}>
                      <option value="normal">Normal</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Order of the sections</p>
                  <ol className="space-y-1">
                    {order.map((s, i) => (
                      <li key={s} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm">
                        <span>{SECTION_TITLES[s]}</span>
                        <span className="flex gap-1">
                          <button className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${SECTION_TITLES[s]} up`}>
                            <ArrowUp size={14} />
                          </button>
                          <button className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${SECTION_TITLES[s]} down`}>
                            <ArrowDown size={14} />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Panel>
            </>
          )}
        </div>

        {/* ---- preview and checks ---- */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {items ? (
            <>
              <Panel title="ATS check" className="!space-y-2">
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li key={c.id} className="flex items-start gap-2 text-sm text-gray-700">
                      {c.level === 'ok' ? (
                        <CircleCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
                      ) : c.level === 'warn' ? (
                        <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
                      ) : (
                        <CircleAlert size={16} className="mt-0.5 shrink-0 text-red-600" />
                      )}
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel className="!space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="rb-name">Name in the resume list</label>
                      <input id="rb-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={[data.personalInfo.name, jobTitle || company].filter(Boolean).join(' - ')} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="rb-role">Written for role</label>
                      <select id="rb-role" className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="">Any role</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={buttonClass} onClick={download} disabled={!blocks.length}>
                    <Download size={16} /> Download PDF
                  </button>
                  <button className={primaryButtonClass} onClick={save} disabled={saving || !blocks.length}>
                    <Save size={16} /> {saving ? 'Saving…' : 'Save to my resumes'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Saving stores the PDF in your resume storage as a private resume, with your choices, so you can reopen and change it later. Each save is a new resume.</p>
              </Panel>

              <PagePreview {...laid} />
            </>
          ) : (
            <Panel title="Preview">
              <p className="text-sm text-gray-500">The resume appears here after you click “Analyse and select”. You can click it with an empty job description too, to start from everything in your portfolio.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
