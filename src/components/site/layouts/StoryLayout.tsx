'use client';

import { useEffect, useState } from 'react';
import type { SectionId } from '@/lib/model';
import Footer from '../Footer';
import HeroBody from '../blocks/HeroBody';
import SectionsFlow from '../SectionsFlow';
import TopBar from '../TopBar';
import { usePortfolio } from '../PortfolioProvider';

// The story follows a piece of data from raw material to something working.
const CHAPTERS: {
  id: string;
  stage: string;
  title: string;
  blurb: string;
  sections: SectionId[];
}[] = [
  {
    id: 'collect',
    stage: 'Collect',
    title: 'Where it starts',
    blurb: 'Who I am and what draws me to data.',
    sections: ['about'],
  },
  {
    id: 'clean',
    stage: 'Clean',
    title: 'How I learned',
    blurb: 'Education, credentials and the road so far.',
    sections: ['education', 'certifications', 'timeline'],
  },
  {
    id: 'analyse',
    stage: 'Analyse',
    title: 'What I can do',
    blurb: 'Skills, and what the data says about my work.',
    sections: ['skills', 'insights'],
  },
  {
    id: 'model',
    stage: 'Model',
    title: 'What I built',
    blurb: 'Projects you can filter, query and explore.',
    sections: ['projects'],
  },
  {
    id: 'deploy',
    stage: 'Deploy',
    title: 'Putting it to work',
    blurb: 'Roles, recognition, and how to work together.',
    sections: ['experience', 'achievements', 'recommendations', 'work', 'contact'],
  },
];

function useActiveChapter(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join('|');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight * 0.4;
      let current = ids[0] ?? '';
      ids.forEach((id) => {
        const el = document.getElementById(`chapter-${id}`);
        if (el && el.getBoundingClientRect().top <= middle) current = id;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}

// A sticky stepper that shows where you are in the story
function StoryRail({ chapters }: { chapters: typeof CHAPTERS }) {
  const { scrollToSection } = usePortfolio();
  const active = useActiveChapter(chapters.map((c) => c.id));
  const activeIndex = Math.max(
    0,
    chapters.findIndex((c) => c.id === active)
  );

  return (
    <nav
      aria-label="Story chapters"
      className="border-line bg-page/85 sticky top-16 z-30 border-b backdrop-blur-md"
    >
      <ol className="container-page flex items-center gap-1 overflow-x-auto py-2.5">
        {chapters.map((chapter, index) => {
          const state = index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'next';
          return (
            <li key={chapter.id} className="flex flex-1 items-center gap-1 last:flex-none">
              <a
                href={`#chapter-${chapter.id}`}
                aria-current={state === 'current' ? 'step' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(`chapter-${chapter.id}`);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  state === 'current'
                    ? 'bg-accent-soft text-accent-soft-ink'
                    : state === 'done'
                      ? 'text-ink'
                      : 'text-muted hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px] ${
                    state === 'next' ? 'border-line-strong' : 'border-accent bg-accent text-white'
                  }`}
                >
                  {index + 1}
                </span>
                {chapter.stage}
              </a>
              {index < chapters.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`hidden h-px min-w-6 flex-1 sm:block ${index < activeIndex ? 'bg-accent' : 'bg-line-strong'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ChapterBanner({
  chapter,
  index,
  total,
}: {
  chapter: (typeof CHAPTERS)[number];
  index: number;
  total: number;
}) {
  return (
    <div id={`chapter-${chapter.id}`} className="container-page scroll-mt-32 pt-24 sm:pt-32">
      <p className="mono-label">
        Stage {String(index + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}
      </p>
      <p
        className="text-accent-ink mt-2 text-6xl font-semibold tracking-tight sm:text-8xl"
        aria-hidden="true"
      >
        {chapter.stage}
      </p>
      <p className="text-ink mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        <span className="sr-only">{chapter.stage}: </span>
        {chapter.title}
      </p>
      <p className="text-muted mt-2 max-w-xl text-lg">{chapter.blurb}</p>
    </div>
  );
}

// A guided scroll: a stepper stays in view while you move from "collect" to "deploy".
export default function StoryLayout() {
  const { model } = usePortfolio();
  const present = new Set(model.sections.map((s) => s.id));
  const chapters = CHAPTERS.filter((chapter) => chapter.sections.some((id) => present.has(id)));

  // a banner goes before the first section of each chapter
  const before: Partial<Record<SectionId, React.ReactNode>> = {};
  chapters.forEach((chapter, index) => {
    const first = model.sections.find((s) => chapter.sections.includes(s.id));
    if (first)
      before[first.id] = <ChapterBanner chapter={chapter} index={index} total={chapters.length} />;
  });

  return (
    <>
      <TopBar variant="bar" />
      <StoryRail chapters={chapters} />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-8 pb-10 sm:pt-20 sm:pb-12"
        >
          <div
            aria-hidden="true"
            className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[34rem]"
          />
          <div className="container-page relative">
            <HeroBody side />
          </div>
        </section>
        <SectionsFlow before={before} />
      </main>
      <Footer />
    </>
  );
}
