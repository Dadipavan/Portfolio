'use client';

import { usePortfolio } from '../PortfolioProvider';

// Which technology is used in which project. Select a row to filter by it, a cell or column to open the project.
export default function Heatmap() {
  const { model, showProjects, openProject } = usePortfolio();
  const { rows, cols, cells } = model.heatmap;
  if (rows.length === 0 || cols.length === 0) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm sm:min-w-[34rem]">
          <caption className="sr-only">
            Technologies by project. A filled cell means the project uses the technology.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="bg-card text-subtle sticky left-0 z-10 pr-3 pb-2 text-left font-mono text-[11px] font-medium tracking-wider uppercase"
              >
                Technology
              </th>
              {cols.map((col, c) => (
                <th key={String(col.id)} scope="col" className="px-1 pb-2 align-bottom">
                  <button
                    type="button"
                    onClick={() => openProject(col.id)}
                    className="text-body hover:text-accent-ink mx-auto block max-w-[7.5rem] text-center text-xs leading-tight font-medium"
                    title={`Open ${col.title}`}
                    aria-label={`Open ${col.title}`}
                  >
                    {/* on a phone the columns are numbered and named in the list below the table */}
                    <span
                      aria-hidden="true"
                      className="bg-surface inline-flex h-6 min-w-6 items-center justify-center rounded-md font-mono text-[11px] font-semibold sm:hidden"
                    >
                      {c + 1}
                    </span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      {col.title}
                    </span>
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="text-subtle pb-2 pl-3 text-right font-mono text-[11px] font-medium tracking-wider uppercase"
              >
                Used in
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.key} className="group">
                <th
                  scope="row"
                  className="border-line bg-card sticky left-0 z-10 border-t py-1.5 pr-3 text-left font-medium"
                >
                  <button
                    type="button"
                    onClick={() => showProjects({ tech: row.label, role: 'all' })}
                    className="text-ink hover:text-accent-ink text-left"
                    title={`Show the projects that use ${row.label}`}
                  >
                    {row.label}
                  </button>
                </th>
                {cols.map((col, c) => (
                  <td key={String(col.id)} className="border-line border-t px-1 py-1.5 text-center">
                    {cells[r][c] ? (
                      <button
                        type="button"
                        onClick={() => openProject(col.id)}
                        aria-label={`${row.label} is used in ${col.title}`}
                        className="bg-accent/80 hover:bg-accent mx-auto block h-5 w-full max-w-[3.25rem] rounded-md transition-colors"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="bg-line-strong mx-auto block h-1.5 w-1.5 rounded-full"
                      />
                    )}
                  </td>
                ))}
                <td className="border-line text-muted border-t py-1.5 pl-3 text-right font-mono text-xs tabular-nums">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol
        className="mt-4 grid grid-cols-1 gap-1 text-sm sm:hidden"
        aria-label="Projects, by column number"
      >
        {cols.map((col, c) => (
          <li key={String(col.id)}>
            <button
              type="button"
              onClick={() => openProject(col.id)}
              className="text-body hover:text-accent-ink flex w-full items-center gap-2.5 rounded-lg py-1 text-left"
            >
              <span
                aria-hidden="true"
                className="bg-surface inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold"
              >
                {c + 1}
              </span>
              <span className="min-w-0">{col.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
