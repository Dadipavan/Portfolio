'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import DemoPreview, { toEmbedUrl } from '../DemoPreview';
import Modal from '../Modal';
import { usePortfolio } from '../PortfolioProvider';
import Tag from '../Tag';
import CaseStudyBody from '../case/CaseStudyBody';

export { hasCaseStudy } from '@/lib/caseStudy';

// The project window ("View more"): the whole story of one project, readable on a phone, closable with Escape.
// A project has its own address (?project=<number>), so it can be shared and opened directly.
export default function CaseStudyDialog() {
  const { content, model, caseStudyId, closeCaseStudy, settings, siteUrl, t } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const project =
    caseStudyId === null
      ? null
      : (content.projects.find((p) => String(p.id) === String(caseStudyId)) ?? null);

  const copyLink = async () => {
    if (!project) return;
    const base = siteUrl || window.location.origin;
    try {
      await navigator.clipboard.writeText(
        `${base}/?project=${encodeURIComponent(String(project.id))}`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked */
    }
  };

  const canEmbed = Boolean(
    project &&
      settings.features.demoPreviews &&
      project.embedLive &&
      project.liveUrl &&
      project.liveUrl !== project.githubUrl &&
      toEmbedUrl(project.liveUrl)
  );

  return (
    <Modal
      open={Boolean(project)}
      onClose={closeCaseStudy}
      size="xl"
      fullOnMobile
      title={project?.title ?? ''}
      description={project?.subtitle || undefined}
    >
      {project && (
        <>
          <CaseStudyBody
            project={project}
            roles={model.roles}
            t={t}
            renderTag={(label) => <Tag label={label} showCount />}
            demo={
              canEmbed ? <DemoPreview url={project.liveUrl!} title={project.title} /> : undefined
            }
          />
          <div className="border-line mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <button type="button" onClick={copyLink} className="btn-ghost">
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
              ) : (
                <Link2 aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? 'Link copied' : 'Copy a link to this project'}
            </button>
            <button type="button" onClick={closeCaseStudy} className="btn-secondary">
              {t('common.close')}
            </button>
            <span role="status" aria-live="polite" className="sr-only">
              {copied ? 'Link copied to the clipboard' : ''}
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}
