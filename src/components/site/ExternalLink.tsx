import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

// Link that opens in a new tab and tells screen reader users so.
export default function ExternalLink({ href, children, className = '', showIcon = true }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      {showIcon && <ExternalLinkIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
