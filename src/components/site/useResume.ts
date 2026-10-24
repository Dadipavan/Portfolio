'use client';

import { pickResume } from '@/lib/roles';
import { usePortfolio } from './PortfolioProvider';

// The resume to offer for the chosen role: an uploaded public resume when there is one, otherwise the
// print-ready CV generated from the portfolio data.
export function useResume() {
  const { content, model, role, t } = usePortfolio();
  const file = pickResume(role, content.resumes, model.roles);

  if (file?.cloudUrl) {
    return { href: file.cloudUrl, label: t('resume.download'), isFile: true, name: file.name };
  }
  return {
    href: role === 'all' ? '/resume' : `/resume?role=${role}`,
    label: t('resume.view'),
    isFile: false,
    name: 'CV',
  };
}
