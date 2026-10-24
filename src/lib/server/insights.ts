// Turns raw visit events into the numbers shown in Admin > Insights.
export interface EventRow {
  created_at: string;
  event: string;
  target: string;
  role: string;
  layout: string;
}

export interface Insights {
  days: number;
  totals: Record<string, number>;
  perDay: { date: string; views: number }[];
  topProjects: { target: string; count: number }[];
  resumeDownloads: { target: string; count: number }[];
  roles: { role: string; count: number }[];
  layouts: { layout: string; count: number }[];
  events: number;
}

const rank = (values: string[], limit = 8) => {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
};

// Day buckets are UTC dates, so the numbers do not depend on where the server runs
export function summariseEvents(rows: EventRow[], days: number, now = new Date()): Insights {
  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    totals[row.event] = (totals[row.event] ?? 0) + 1;
  });

  const perDay: { date: string; views: number }[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    index.set(date, perDay.length);
    perDay.push({ date, views: 0 });
  }
  rows.forEach((row) => {
    if (row.event !== 'page_view') return;
    const at = index.get(row.created_at.slice(0, 10));
    if (at !== undefined) perDay[at].views += 1;
  });

  return {
    days,
    totals,
    perDay,
    topProjects: rank(rows.filter((r) => r.event === 'project_open').map((r) => r.target)).map(
      ([target, count]) => ({ target, count })
    ),
    resumeDownloads: rank(
      rows
        .filter((r) => r.event === 'resume_download' || r.event === 'cv_view')
        .map((r) => r.target)
    ).map(([target, count]) => ({ target, count })),
    roles: rank(rows.filter((r) => r.event === 'role_switch').map((r) => r.role)).map(
      ([role, count]) => ({ role, count })
    ),
    layouts: rank(rows.filter((r) => r.event === 'page_view').map((r) => r.layout)).map(
      ([layout, count]) => ({ layout, count })
    ),
    events: rows.length,
  };
}
