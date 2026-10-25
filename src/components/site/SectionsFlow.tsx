'use client';

import { Fragment } from 'react';
import type { SectionId } from '@/lib/model';
import About from './About';
import Achievements from './Achievements';
import Certifications from './Certifications';
import Contact from './Contact';
import Education from './Education';
import Experience from './Experience';
import ProjectBrowser from './ProjectBrowser';
import Recommendations from './Recommendations';
import SkillsBrowser from './SkillsBrowser';
import TimelineSection from './TimelineSection';
import WorkWithMe from './WorkWithMe';
import Insights from './blocks/Insights';
import { usePortfolio } from './PortfolioProvider';

interface SectionsFlowProps {
  // content shown just before a section (for example a chapter heading in the story look)
  before?: Partial<Record<SectionId, React.ReactNode>>;
}

// Every section that has content, in the order the active look tells it
export default function SectionsFlow({ before }: SectionsFlowProps) {
  const { model } = usePortfolio();

  return (
    <>
      {model.sections.map((section) => {
        const { id, number } = section;
        let node: React.ReactNode = null;
        switch (id) {
          case 'about':
            node = <About number={number} />;
            break;
          case 'insights':
            node = <Insights number={number} />;
            break;
          case 'projects':
            node = <ProjectBrowser number={number} />;
            break;
          case 'skills':
            node = <SkillsBrowser number={number} />;
            break;
          case 'timeline':
            node = <TimelineSection number={number} />;
            break;
          case 'experience':
            node = <Experience number={number} />;
            break;
          case 'education':
            node = <Education number={number} />;
            break;
          case 'certifications':
            node = <Certifications number={number} />;
            break;
          case 'achievements':
            node = <Achievements number={number} />;
            break;
          case 'recommendations':
            node = <Recommendations number={number} />;
            break;
          case 'work':
            node = <WorkWithMe number={number} />;
            break;
          case 'contact':
            node = <Contact number={number} />;
            break;
        }
        return (
          <Fragment key={id}>
            {before?.[id]}
            {node}
          </Fragment>
        );
      })}
    </>
  );
}
