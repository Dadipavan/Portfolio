interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

// The frame around every chart: a title, a one-line explanation and the chart itself
export default function ChartCard({
  title,
  description,
  className = '',
  children,
}: ChartCardProps) {
  return (
    <figure className={`card flex h-full flex-col p-4 sm:p-6 ${className}`}>
      <figcaption className="mb-4">
        <span className="text-ink block font-semibold tracking-tight">{title}</span>
        {description && <span className="text-muted mt-0.5 block text-sm">{description}</span>}
      </figcaption>
      {children}
    </figure>
  );
}
