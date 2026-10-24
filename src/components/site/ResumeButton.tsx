'use client';

import { Download, FileText } from 'lucide-react';
import { usePortfolio } from './PortfolioProvider';
import { useResume } from './useResume';

interface ResumeButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  // a short label ("Resume" / "CV") for tight spaces such as the top bar
  compact?: boolean;
}

export default function ResumeButton({
  variant = 'secondary',
  className = '',
  compact = false,
}: ResumeButtonProps) {
  const resume = useResume();
  const { track } = usePortfolio();
  const classes = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost' }[
    variant
  ];
  const Icon = resume.isFile ? Download : FileText;
  const label = compact ? (resume.isFile ? 'Resume' : 'CV') : resume.label;

  return (
    <a
      href={resume.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track(resume.isFile ? 'resume_download' : 'cv_view', resume.name)}
      className={`${classes} ${className}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
