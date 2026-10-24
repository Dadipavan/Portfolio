// Kept as a simple wrapper. Content is never hidden while it waits to scroll into view: a heading that
// stays invisible (in a screenshot, a print, or a slow device) is worse than a missing animation.
export default function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
