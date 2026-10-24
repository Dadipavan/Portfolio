'use client';

import { evidenceTotal, isLinkable, tagKey } from '@/lib/tags';
import { usePortfolio } from './PortfolioProvider';

interface TagProps {
  label: string;
  className?: string;
  // show how many places back this tag up
  showCount?: boolean;
}

// A skill, technology or course name. When something in the portfolio backs it up, it opens the
// explorer (or filters the projects when the explorer is switched off).
export default function Tag({ label, className = '', showCount = false }: TagProps) {
  const { model, openTag, settings } = usePortfolio();
  const key = tagKey(label);
  const evidence = model.evidence[key];
  const interactive =
    isLinkable(model.evidence, label) &&
    (settings.features.explorer || Boolean(model.techUsage[key]));

  if (!interactive) return <span className={`chip ${className}`}>{label}</span>;

  const total = evidence ? evidenceTotal(evidence) : 0;
  return (
    <button
      type="button"
      onClick={() => openTag(label)}
      title={`See where ${label} shows up in my work`}
      aria-haspopup={settings.features.explorer ? 'dialog' : undefined}
      className={`tag ${className}`}
    >
      {label}
      {showCount && total > 0 && (
        <span className="bg-accent-soft text-accent-soft-ink rounded px-1.5 text-[11px] font-semibold tabular-nums">
          {total}
        </span>
      )}
    </button>
  );
}
