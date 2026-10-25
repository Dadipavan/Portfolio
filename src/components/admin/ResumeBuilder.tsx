'use client';

// Resume builder. Two ways in: build it yourself by ticking what to include, or paste a job description and get
// recommendations. Either way every part of the resume can be edited on the left, with the exact PDF pages
// as a live preview on the right. The portfolio content is never changed.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  Download,
  FilePlus2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserPen,
} from 'lucide-react';
import { getPortfolioDataForEditing, type Resume } from '@/lib/dataManager';
import { ResumeManager } from '@/lib/resumeManager';
import { mergeSiteSettings } from '@/lib/siteSettings';
import type { RoleDef } from '@/lib/types';
import { coverage, extractKeywords, type Keyword } from '@/lib/resume/keywords';
import { buildPdf, layoutBlocks, type Density, type PageSize, type PdfOptions } from '@/lib/resume/pdf';
import {
  DEFAULT_ORDER,
  autoSelect,
  blocksText,
  buildBlocks,
  draftSummary,
  newCustomSection,
  normaliseItems,
  ownSelect,
  sectionTitle,
  type BuilderItems,
  type PickItem,
  type SectionKey,
  type SourceData,
} from '@/lib/resume/source';
import { isRecipe, pdfFileName, type ResumeRecipe } from '@/lib/resume/recipe';
import { runChecks } from '@/lib/resume/checks';
import { useConfirm, useNotify } from '@/components/admin/Feedback';
import { buttonClass, primaryButtonClass } from '@/components/admin/kit';
import {
  Accordion,
  EntriesEditor,
  Field,
  HeaderEditor,
  IconButton,
  LinesEditor,
  OneLineEditor,
  SkillsEditor,
} from '@/components/admin/ResumeEditors';

const DRAFT_KEY = 'resume_builder_draft_v2';

export type BuilderMode = 'own' | 'jd';

interface Props {
  // how a new resume is started; a resume opened for editing keeps the way it was made
  initialMode?: BuilderMode;
  // a resume made earlier in the builder, opened for editing
  initialRecipe?: ResumeRecipe | null;
  onClose: () => void;
  // called after a resume was saved to the list
  onSaved: () => void;
}

const select =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30';
const label = 'mb-1 block text-xs font-medium text-gray-600';

function Card({ title, description, children, className = '' }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
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


// ---------- the builder ----------

export default function ResumeBuilder({ initialMode = 'jd', initialRecipe, onClose, onSaved }: Props) {
  const notify = useNotify();
  const confirm = useConfirm();

  const [data, setData] = useState<SourceData | null>(null);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loadError, setLoadError] = useState('');

  const [mode, setMode] = useState<BuilderMode>(initialRecipe?.mode ?? initialMode);
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
  const [open, setOpen] = useState<Set<string>>(new Set(['header', 'experience']));
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

  // restore a saved resume or the unfinished draft; otherwise start "build my own" with everything offered
  useEffect(() => {
    if (!data || restored.current) return;
    restored.current = true;
    let source: Partial<ResumeRecipe> | null = initialRecipe && isRecipe(initialRecipe) ? initialRecipe : null;
    let fromDraft = false;
    if (!source && !initialRecipe) {
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
    if (source && source.items) {
      setJobTitle(source.jobTitle ?? '');
      setCompany(source.company ?? '');
      setJd(source.jd ?? '');
      setItems(normaliseItems(source.items, data.personalInfo));
      setOrder(source.order ?? DEFAULT_ORDER);
      if (source.options) setOptions(source.options);
      setMode(source.mode ?? (source.jd ? 'jd' : 'own'));
      setKeywords(extractKeywords(source.jd ?? '', vocabulary));
      if (fromDraft) notify.info('Your unfinished resume was restored.');
    } else if (initialMode === 'own') {
      setItems(ownSelect(data));
    }
  }, [data, initialRecipe, initialMode, vocabulary, notify]);

  // keep an unfinished draft in this browser
  useEffect(() => {
    if (!items) return;
    const t = setTimeout(() => {
      try {
        const draft: ResumeRecipe = { version: 1, mode, jobTitle, company, jd, items, order, options, savedAt: new Date().toISOString() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full or blocked: the draft is simply not kept */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [items, mode, jobTitle, company, jd, order, options]);

  const pdfOptions: PdfOptions = useMemo(
    () => ({ ...options, title: `${items?.header.name ?? 'Resume'}${jobTitle ? ` - ${jobTitle}` : ''}`, author: items?.header.name ?? '' }),
    [options, items?.header.name, jobTitle]
  );

  const blocks = useMemo(() => (items ? buildBlocks(items, order) : []), [items, order]);
  const laid = useMemo(() => layoutBlocks(blocks, pdfOptions), [blocks, pdfOptions]);
  const cov = useMemo(() => coverage(blocksText(blocks), keywords), [blocks, keywords]);
  const checks = useMemo(() => (items ? runChecks(items.header, blocks, laid.pages.length) : []), [items, blocks, laid.pages.length]);

  const patch = (change: Partial<BuilderItems>) => setItems((cur) => (cur ? { ...cur, ...change } : cur));
  const toggle = (id: string) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chooseMode = (next: BuilderMode) => {
    setMode(next);
    if (next === 'own' && !items && data) setItems(ownSelect(data));
  };

  const analyse = async () => {
    if (!data) return;
    if (
      items &&
      !(await confirm({
        title: 'Choose again?',
        message: 'This re-selects items for the job description and replaces your current ticks and edits (including your header).',
        confirmLabel: 'Re-select',
      }))
    )
      return;
    const kw = extractKeywords(jd, vocabulary);
    setKeywords(kw);
    setItems(autoSelect(data, kw, jobTitle));
    setOrder(DEFAULT_ORDER);
    if (!jd.trim()) notify.info('No job description: everything from your portfolio is offered, nothing is ranked.');
    else if (!kw.length) notify.info('No keywords were found. Paste more of the job description.');
    else notify.success(`${kw.length} keywords found. The best matches are ticked: check them in the preview.`);
  };

  const startOver = async () => {
    if (!data) return;
    if (!(await confirm({ title: 'Start over?', message: 'Your edits, ticks and job description in this unfinished resume are cleared. Saved resumes are not affected.', confirmLabel: 'Start over', danger: true }))) return;
    setItems(mode === 'own' ? ownSelect(data) : null);
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

  const moveSection = (key: SectionKey, d: -1 | 1) =>
    setOrder((cur) => {
      const i = cur.indexOf(key);
      const j = i + d;
      if (i < 0 || j < 0 || j >= cur.length) return cur;
      const copy = [...cur];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const addCustom = () => {
    const c = newCustomSection();
    patch({ custom: [...(items?.custom ?? []), c] });
    setOrder((cur) => [...cur, `custom:${c.id}` as SectionKey]);
    setOpen((cur) => new Set(cur).add(`custom:${c.id}`));
  };

  const removeCustom = async (id: string) => {
    if (!(await confirm({ title: 'Delete this section?', message: 'The section and its lines are removed from this resume.', confirmLabel: 'Delete', danger: true }))) return;
    patch({ custom: (items?.custom ?? []).filter((c) => c.id !== id) });
    setOrder((cur) => cur.filter((k) => k !== `custom:${id}`));
  };

  // a keyword the owner really has can be added to the skills with one click
  const addSkill = (term: string) =>
    setItems((cur) => {
      if (!cur) return cur;
      const text = term.replace(/\b\w/g, (c) => c.toUpperCase());
      const extra = cur.skills.find((c) => c.category === 'Additional');
      const entry = { name: text, on: true, hit: true };
      const skills = extra
        ? cur.skills.map((c) => (c === extra ? { ...c, on: true, skills: [...c.skills, entry] } : c))
        : [...cur.skills, { category: 'Additional', on: true, skills: [entry] }];
      return { ...cur, skills };
    });

  const makeFile = () => ({
    bytes: buildPdf(blocks, pdfOptions),
    fileName: pdfFileName(items?.header.name ?? 'Resume', company || jobTitle),
  });

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
    if (!items || !blocks.length) return;
    const title = name.trim() || [items.header.name, jobTitle || company].filter(Boolean).join(' - ') || 'Resume';
    setSaving(true);
    try {
      const { bytes, fileName } = makeFile();
      const file = new File([new Uint8Array(bytes)], fileName, { type: 'application/pdf' });
      const description = [jobTitle && `Built for: ${jobTitle}`, company && `at ${company}`].filter(Boolean).join(' ') || 'Built in the resume builder';
      const saved: Resume = await ResumeManager.uploadResume(file, title, description);
      const recipe: ResumeRecipe = { version: 1, mode, jobTitle, company, jd, items, order, options, savedAt: new Date().toISOString() };
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
      <Card>
        <p className="text-sm text-red-700">{loadError}</p>
        <button className={buttonClass} onClick={onClose}>Back to resumes</button>
      </Card>
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
  const counts = (list: PickItem[]) => `${list.filter((x) => x.on).length}/${list.length}`;

  const sectionControls = (key: SectionKey) => {
    const i = order.indexOf(key);
    return (
      <span className="flex shrink-0">
        <IconButton label={`Move ${sectionTitle(items!, key) || 'section'} up`} disabled={i <= 0} onClick={() => moveSection(key, -1)}><ArrowUp size={14} /></IconButton>
        <IconButton label={`Move ${sectionTitle(items!, key) || 'section'} down`} disabled={i < 0 || i >= order.length - 1} onClick={() => moveSection(key, 1)}><ArrowDown size={14} /></IconButton>
      </span>
    );
  };

  const headingField = (key: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements') => (
    <Field
      label="Heading in the resume"
      value={items?.titles[key] ?? ''}
      placeholder={sectionTitle({ ...items!, titles: {} }, key)}
      onChange={(v) => patch({ titles: { ...items!.titles, [key]: v } })}
      hint="Leave empty for the standard heading. ATS software knows the standard ones best."
    />
  );

  const renderSection = (key: SectionKey) => {
    if (!items) return null;
    const title = sectionTitle(items, key) || 'Section';
    if (key.startsWith('custom:')) {
      const c = items.custom.find((x) => `custom:${x.id}` === key);
      if (!c) return null;
      const setC = (change: Partial<typeof c>) => patch({ custom: items.custom.map((x) => (x.id === c.id ? { ...x, ...change } : x)) });
      return (
        <Accordion key={key} title={title} badge="your section" open={open.has(key)} onToggle={() => toggle(key)} actions={<>{sectionControls(key)}<IconButton label="Delete section" danger onClick={() => removeCustom(c.id)}><Trash2 size={14} /></IconButton></>}>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 accent-purple-600" checked={c.on} onChange={(e) => setC({ on: e.target.checked })} /> Show this section
          </label>
          <Field label="Heading" value={c.title} onChange={(v) => setC({ title: v })} />
          <LinesEditor lines={c.lines} onChange={(lines) => setC({ lines })} />
        </Accordion>
      );
    }
    const std = key as 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements';
    let badge: string | undefined;
    let body: React.ReactNode = null;
    if (std === 'summary') {
      badge = items.summary.trim() ? 'on' : 'empty';
      body = (
        <>
          <Field label="Summary" rows={5} value={items.summary} onChange={(v) => patch({ summary: v })} hint="A starting point built from your profile. Make it yours; leave it empty to drop the section." />
          <button type="button" className="text-xs text-purple-700 hover:underline" onClick={() => patch({ summary: draftSummary(data.personalInfo, items.skills, jobTitle) })}>
            Write it again from my profile
          </button>
        </>
      );
    } else if (std === 'skills') {
      badge = `${items.skills.filter((c) => c.on).length}/${items.skills.length}`;
      body = <SkillsEditor skills={items.skills} onChange={(skills) => patch({ skills })} />;
    } else if (std === 'experience') {
      badge = counts(items.experience);
      body = <EntriesEditor list={items.experience} onChange={(l) => patch({ experience: l })} labels={{ left: 'Job title', right: 'Dates', sub: 'Company and location' }} addLabel="Add a job" />;
    } else if (std === 'projects') {
      badge = counts(items.projects);
      body = <EntriesEditor list={items.projects} onChange={(l) => patch({ projects: l })} labels={{ left: 'Project name', right: 'Year', sub: 'Technologies line' }} addLabel="Add a project" />;
    } else if (std === 'education') {
      badge = counts(items.education);
      body = <EntriesEditor list={items.education} onChange={(l) => patch({ education: l })} labels={{ left: 'School or college', right: 'Dates', sub: 'Degree and grade' }} addLabel="Add education" />;
    } else if (std === 'certifications') {
      badge = counts(items.certifications);
      body = <OneLineEditor list={items.certifications} onChange={(l) => patch({ certifications: l })} addLabel="Add a certification" placeholder="Certificate name – issuer (year)" />;
    } else {
      badge = counts(items.achievements);
      body = <OneLineEditor list={items.achievements} onChange={(l) => patch({ achievements: l })} addLabel="Add an achievement" placeholder="Achievement – what it was" />;
    }
    return (
      <Accordion key={key} title={title} badge={badge} open={open.has(key)} onToggle={() => toggle(key)} actions={sectionControls(key)}>
        {body}
        {headingField(std)}
      </Accordion>
    );
  };

  const modeButton = (value: BuilderMode, text: string, icon: React.ReactNode) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => chooseMode(value)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === value ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
    >
      {icon} {text}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resume builder</h2>
          <p className="text-sm text-gray-500">Everything on the left can be edited. The preview on the right is the exact PDF. Your portfolio content is never changed.</p>
        </div>
        <button className={buttonClass} onClick={onClose}>
          <ArrowLeft size={16} /> Back to resumes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---- the left panel: everything that can be edited ---- */}
        <div className="space-y-4">
          <div role="group" aria-label="How to build" className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {modeButton('own', 'Build my own', <UserPen size={16} />)}
            {modeButton('jd', 'From a job description', <Sparkles size={16} />)}
          </div>

          {mode === 'jd' && (
            <>
              <Card title="The job" description="Paste the whole job description. Keywords are matched against your own skills and projects. Nothing is sent anywhere.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Job title" value={jobTitle} onChange={setJobTitle} placeholder="Data Analyst" />
                  <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Corp" />
                </div>
                <Field label="Job description" rows={8} value={jd} onChange={setJd} placeholder="Paste the job description here" />
                <div className="flex flex-wrap gap-2">
                  <button className={primaryButtonClass} onClick={analyse}>
                    <Sparkles size={16} /> {items ? 'Analyse again' : 'Analyse and select'}
                  </button>
                </div>
              </Card>

              {items && (
                <Card title="Keywords" description="Checked against what is in the resume right now, so they update as you edit.">
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
                      <p className="mb-1 text-xs font-medium text-gray-700">Not in your resume yet</p>
                      <p className="mb-1.5 text-xs text-gray-500">Click a skill with <Plus size={10} className="inline" /> to add it, only if it is true for you.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cov.missing.map((k) => (
                          <button key={k.term} type="button" onClick={() => addSkill(k.term)} title={k.known ? 'A skill: add it to your skills if it is true for you' : 'A word the job description repeats'} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-900 hover:bg-amber-100">
                            {k.term} {k.known && <Plus size={10} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}

          {items ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Edit your resume</h3>
                <button className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600" onClick={startOver}>
                  <RotateCcw size={13} /> Start over
                </button>
              </div>

              <Accordion title="Header" badge={items.header.name ? undefined : 'name missing'} open={open.has('header')} onToggle={() => toggle('header')}>
                <HeaderEditor header={items.header} onChange={(header) => patch({ header })} />
              </Accordion>

              {order.map((key) => renderSection(key))}

              <button type="button" onClick={addCustom} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:border-purple-400 hover:text-purple-700">
                <FilePlus2 size={16} /> Add your own section (languages, volunteering, publications…)
              </button>

              <Card title="Layout">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={label} htmlFor="rb-page">Paper</label>
                    <select id="rb-page" className={select} value={options.pageSize} onChange={(e) => setOptions({ ...options, pageSize: e.target.value as PageSize })}>
                      <option value="letter">US Letter</option>
                      <option value="a4">A4</option>
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="rb-size">Text size</label>
                    <select id="rb-size" className={select} value={options.fontSize} onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}>
                      <option value={9.5}>Small (9.5)</option>
                      <option value={10}>Compact (10)</option>
                      <option value={10.5}>Standard (10.5)</option>
                      <option value={11}>Large (11)</option>
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="rb-density">Spacing</label>
                    <select id="rb-density" className={select} value={options.density} onChange={(e) => setOptions({ ...options, density: e.target.value as Density })}>
                      <option value="normal">Normal</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            mode === 'own' && (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-purple-500" />
              </div>
            )
          )}
        </div>

        {/* ---- the right panel: checks, saving and the exact pages ---- */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {items ? (
            <>
              <Card title="ATS check" className="!space-y-2">
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li key={c.id} className="flex items-start gap-2 text-sm text-gray-700">
                      {c.level === 'ok' ? <CircleCheck size={16} className="mt-0.5 shrink-0 text-green-600" /> : c.level === 'warn' ? <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" /> : <CircleAlert size={16} className="mt-0.5 shrink-0 text-red-600" />}
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="!space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name in the resume list" value={name} onChange={setName} placeholder={[items.header.name, jobTitle || company].filter(Boolean).join(' - ')} />
                  <div>
                    <label className={label} htmlFor="rb-role">Written for role</label>
                    <select id="rb-role" className={select} value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="">Any role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
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
                <p className="text-xs text-gray-500">Saving stores the PDF in your resume storage as a private resume, with your edits, so you can reopen it later. Each save is a new resume.</p>
              </Card>

              <PagePreview {...laid} />
            </>
          ) : (
            <Card title="Preview">
              <p className="text-sm text-gray-500">The resume appears here after you click “Analyse and select”. You can click it with an empty job description too, to start from everything in your portfolio.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
