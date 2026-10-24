// Data behind the charts. Everything here is a pure function of the portfolio content, so the same
// numbers come out on the server, in the browser and in the admin live preview.
import type { RoleSet } from './roles';
import { tagKey } from './tags';
import type { PortfolioContent, Project, SkillCategory } from './types';

type RoleOrNone = string; // a role id, or 'none' for a technology without a role

// squared distance: plain arithmetic, so every browser and the server get exactly the same answer
const distance2 = (dx: number, dy: number) => dx * dx + dy * dy;

export interface YearDatum {
  year: string;
  count: number;
  projects: { id: string | number; title: string }[];
}

// Projects per year, with empty years filled in so the axis has no gaps
export function buildYearData(projects: Project[]): YearDatum[] {
  const years = projects.map((p) => Number(p.year)).filter((y) => Number.isFinite(y) && y > 1900);
  if (years.length === 0) return [];

  const first = Math.min(...years);
  const last = Math.max(...years);
  const data: YearDatum[] = [];
  for (let year = first; year <= last; year++)
    data.push({ year: String(year), count: 0, projects: [] });

  projects.forEach((project) => {
    const datum = data.find((d) => d.year === String(Number(project.year)));
    if (datum) {
      datum.count += 1;
      datum.projects.push({ id: project.id, title: project.title });
    }
  });
  return data;
}

export interface RadarAxis {
  id: string;
  label: string;
  skills: number;
  projects: number;
  // 0..1, each series scaled by its own maximum so both fit on one chart
  skillsNorm: number;
  projectsNorm: number;
}

export function buildRadarData(
  projects: Project[],
  categories: SkillCategory[],
  roles: RoleSet
): RadarAxis[] {
  const skills = new Map<string, string>();
  categories.forEach((c) => c.skills.forEach((s) => skills.set(tagKey(s), s)));
  const skillList = Array.from(skills.values());

  const axes = roles.list.map((role) => ({
    id: role.id,
    label: role.label,
    skills: skillList.filter((skill) => roles.skillMatches(skill, role.id)).length,
    projects: projects.filter((p) => roles.projectRoles(p).includes(role.id)).length,
  }));
  const maxSkills = Math.max(1, ...axes.map((a) => a.skills));
  const maxProjects = Math.max(1, ...axes.map((a) => a.projects));

  return axes.map((a) => ({
    ...a,
    skillsNorm: a.skills / maxSkills,
    projectsNorm: a.projects / maxProjects,
  }));
}

interface TechStat {
  key: string;
  label: string;
  count: number;
  track: RoleOrNone;
}

// Technologies used in the projects, how many projects use each, and the role each one belongs to.
// A technology that only one role uses by name (LSTM, Streamlit) takes that role. A general tool
// (Python, Pandas) takes the role whose projects rely on it the most.
function techStats(projects: Project[], roles: RoleSet): TechStat[] {
  const projectTracks = projects.map((p) => roles.projectRoles(p));
  const trackTotals = new Map<string, number>();
  projectTracks.forEach((tracks) =>
    tracks.forEach((t) => trackTotals.set(t, (trackTotals.get(t) ?? 0) + 1))
  );

  const stats = new Map<string, { label: string; count: number; used: Map<string, number> }>();
  projects.forEach((project, index) => {
    new Set(project.technologies.map(tagKey)).forEach((key) => {
      const label = project.technologies.find((t) => tagKey(t) === key) ?? key;
      const stat = stats.get(key) ?? { label, count: 0, used: new Map<string, number>() };
      stat.count += 1;
      projectTracks[index].forEach((t) => stat.used.set(t, (stat.used.get(t) ?? 0) + 1));
      stats.set(key, stat);
    });
  });

  return Array.from(stats.entries())
    .map(([key, stat]) => {
      let track: RoleOrNone = 'none';
      if (stat.used.size > 0) {
        const byName = roles.strictRolesOf(stat.label).filter((t) => stat.used.has(t));
        if (byName.length === 1) {
          track = byName[0];
        } else {
          const ranked = Array.from(stat.used.entries())
            .map(([t, n]) => ({ t, share: n / ((trackTotals.get(t) ?? 0) + 1) })) // +1 so a role with a single project does not win by default
            .sort((a, b) => b.share - a.share || roles.priorityOf(b.t) - roles.priorityOf(a.t));
          track = ranked[0].t;
        }
      }
      return { key, label: stat.label, count: stat.count, track };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export interface Bubble extends TechStat {
  x: number;
  y: number;
  r: number;
}

export interface TechMapData {
  width: number;
  height: number;
  bubbles: Bubble[];
}

// Tries to place every bubble along a spiral, biggest first; returns null when they do not all fit
function packBubbles(
  stats: TechStat[],
  width: number,
  height: number,
  scale: number
): Bubble[] | null {
  const placed: Bubble[] = [];

  for (const stat of stats) {
    const r = Math.max(3.9 + 1.5 * Math.sqrt(stat.count), minBubbleRadius(stat.label)) * scale;
    let spot: { x: number; y: number } | null = null;

    for (let step = 0; step < 6000 && !spot; step++) {
      const angle = step * 0.35;
      const distance = step * 0.011;
      // sin and cos can differ in their last digits between browsers, so the position is rounded
      const x = Math.round((width / 2 + Math.cos(angle) * distance * 1.7) * 100) / 100;
      const y = Math.round((height / 2 + Math.sin(angle) * distance) * 100) / 100;
      if (x - r < 1 || x + r > width - 1 || y - r < 1 || y + r > height - 1) continue;
      if (placed.every((p) => distance2(p.x - x, p.y - y) >= (p.r + r + 0.8) ** 2)) spot = { x, y };
    }

    if (!spot) return null;
    placed.push({ ...stat, ...spot, r });
  }
  return placed;
}

// Bubbles packed along a spiral, biggest first. Deterministic, so server and browser agree. When the
// technologies do not fit, the picture grows taller (the bubbles keep their size so every name stays readable).
export function buildTechMap(projects: Project[], roles: RoleSet, limit = 40): TechMapData {
  const width = 100;
  const stats = techStats(projects, roles).slice(0, limit);
  const heights = [66, 74, 82, 92, 104, 118];

  for (const height of heights) {
    const bubbles = packBubbles(stats, width, height, 1);
    if (bubbles) return { width, height, bubbles };
  }

  // last resort for an enormous list: smaller bubbles
  const height = heights[heights.length - 1];
  let scale = 0.9;
  for (let attempt = 0; attempt < 8; attempt++, scale *= 0.88) {
    const bubbles = packBubbles(stats, width, height, scale);
    if (bubbles) return { width, height, bubbles };
  }
  return { width, height, bubbles: [] };
}

const LABEL_CHAR_WIDTH = 0.6; // width of a letter relative to the font size
const LABEL_MIN_FONT = 1.5;
const LABEL_MAX_FONT = 2.6;

// Every way to break a name into at most three lines (at spaces, or just after a hyphen)
function splitOptions(label: string): string[][] {
  const words = label.split(/(?<=-)|\s+/).filter(Boolean);
  const joiner = (line: string[]) => line.join(' ').replace(/- /g, '-');
  const options: string[][] = [[label]];
  for (let i = 1; i < words.length; i++) {
    options.push([joiner(words.slice(0, i)), joiner(words.slice(i))]);
    for (let j = i + 1; j < words.length; j++) {
      options.push([joiner(words.slice(0, i)), joiner(words.slice(i, j)), joiner(words.slice(j))]);
    }
  }
  return options;
}

// How to write a technology's name inside its bubble: up to three lines, sized to fit
export function fitBubbleLabel(
  label: string,
  radius: number
): { lines: string[]; fontSize: number } {
  const usableWidth = radius * 2 * 0.8;
  const usableHeight = radius * 2 * 0.74;

  let best = { lines: [label], size: 0 };
  for (const lines of splitOptions(label)) {
    const longest = Math.max(...lines.map((l) => l.length));
    const size = Math.min(
      usableWidth / (longest * LABEL_CHAR_WIDTH),
      usableHeight / (lines.length * 1.12)
    );
    if (size > best.size) best = { lines, size };
  }

  if (best.size >= LABEL_MIN_FONT)
    return { lines: best.lines, fontSize: Math.min(LABEL_MAX_FONT, best.size) };

  const maxChars = Math.max(3, Math.floor(usableWidth / (LABEL_MIN_FONT * LABEL_CHAR_WIDTH)));
  return {
    lines: best.lines.map((l) => (l.length > maxChars ? `${l.slice(0, maxChars - 1)}…` : l)),
    fontSize: LABEL_MIN_FONT,
  };
}

// The smallest bubble in which the whole name is written at a comfortable size
export function minBubbleRadius(label: string, targetFont = 1.7): number {
  for (let r = 3.5; r < 9; r += 0.1) {
    const fit = fitBubbleLabel(label, r);
    if (fit.fontSize >= targetFont && !fit.lines.some((l) => l.endsWith('…')))
      return Math.round(r * 10) / 10;
  }
  return 9;
}

export interface HeatmapData {
  rows: { key: string; label: string; count: number }[];
  cols: { id: string | number; title: string }[];
  cells: boolean[][];
}

// Which technology is used in which project
export function buildHeatmap(projects: Project[], roles: RoleSet, limit = 14): HeatmapData {
  const rows = techStats(projects, roles)
    .slice(0, limit)
    .map(({ key, label, count }) => ({ key, label, count }));
  const cols = projects.map((p) => ({ id: p.id, title: p.title }));
  const cells = rows.map((row) =>
    projects.map((p) => p.technologies.some((t) => tagKey(t) === row.key))
  );
  return { rows, cols, cells };
}

export interface ConstellationLabel {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  text: string;
}

export interface ConstellationNode extends TechStat {
  x: number;
  y: number;
  r: number;
  // where the name is written; missing when there is no clear space (it still shows on hover)
  labelAt?: ConstellationLabel;
  labelled: boolean;
}

export interface ConstellationData {
  width: number;
  height: number;
  // size of the names in canvas units, and a factor for line widths and dot outlines
  fontSize: number;
  scale: number;
  nodes: ConstellationNode[];
  edges: { a: string; b: string; weight: number }[];
}

// Tiny seeded random generator so the layout never changes between renders
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Where each role's cluster gravitates: spread over the whole canvas, zig-zagging so neighbours do not
// sit on top of each other. A wide canvas runs left to right, a tall one top to bottom.
function clusterCenters(
  roles: RoleSet,
  width: number,
  height: number
): Map<string, [number, number]> {
  const centers = new Map<string, [number, number]>();
  const count = roles.list.length;
  const portrait = height > width;
  roles.list.forEach((role, index) => {
    const along = count === 1 ? 0.5 : 0.18 + (0.64 * index) / (count - 1);
    const across = index % 2 === 0 ? 0.68 : 0.3;
    centers.set(
      role.id,
      portrait ? [across * width, along * height] : [along * width, across * height]
    );
  });
  centers.set('none', portrait ? [width * 0.5, height * 0.9] : [width * 0.5, height * 0.875]);
  return centers;
}

// Sizes that depend on how big the names are drawn
interface Metrics {
  labelHeight: number;
  labelChar: number; // width of one letter at the label font size, in canvas units
  fontSize: number;
  maxLabel: number;
  scale: number;
}

const metricsFor = (scale: number, maxLabel: number): Metrics => ({
  labelHeight: 3.6 * scale,
  labelChar: 1.62 * scale,
  fontSize: 2.7 * scale,
  maxLabel,
  scale,
});

const clipLabel = (label: string, max: number) =>
  label.length > max ? `${label.slice(0, max - 1)}…` : label;

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const overlaps = (a: Box, b: Box, gap = 0.4) =>
  a.x0 < b.x1 + gap && a.x1 > b.x0 - gap && a.y0 < b.y1 + gap && a.y1 > b.y0 - gap;

const touchesCircle = (box: Box, cx: number, cy: number, r: number) => {
  const nearestX = Math.max(box.x0, Math.min(cx, box.x1));
  const nearestY = Math.max(box.y0, Math.min(cy, box.y1));
  return distance2(cx - nearestX, cy - nearestY) < (r + 0.5) ** 2;
};

// Writes each name where it does not collide with a dot or another name: below, above, right, then left
function placeLabels(
  nodes: Omit<ConstellationNode, 'labelAt' | 'labelled'>[],
  width: number,
  height: number,
  m: Metrics
) {
  const placed: Box[] = [];
  const labels = new Map<string, ConstellationLabel>();
  const H = m.labelHeight;

  nodes.forEach((node) => {
    const text = clipLabel(node.label, m.maxLabel);
    const w = text.length * m.labelChar + 1;
    const candidates: { box: Box; label: ConstellationLabel }[] = [
      {
        box: {
          x0: node.x - w / 2,
          x1: node.x + w / 2,
          y0: node.y + node.r + 0.6,
          y1: node.y + node.r + 0.6 + H,
        },
        label: { x: node.x, y: node.y + node.r + 0.6 + H * 0.78, anchor: 'middle', text },
      },
      {
        box: {
          x0: node.x - w / 2,
          x1: node.x + w / 2,
          y0: node.y - node.r - 0.6 - H,
          y1: node.y - node.r - 0.6,
        },
        label: { x: node.x, y: node.y - node.r - 0.6 - H * 0.22, anchor: 'middle', text },
      },
      {
        box: {
          x0: node.x + node.r + 0.8,
          x1: node.x + node.r + 0.8 + w,
          y0: node.y - H / 2,
          y1: node.y + H / 2,
        },
        label: { x: node.x + node.r + 1.3, y: node.y + H * 0.3, anchor: 'start', text },
      },
      {
        box: {
          x0: node.x - node.r - 0.8 - w,
          x1: node.x - node.r - 0.8,
          y0: node.y - H / 2,
          y1: node.y + H / 2,
        },
        label: { x: node.x - node.r - 1.3, y: node.y + H * 0.3, anchor: 'end', text },
      },
    ];

    const fit = candidates.find(
      ({ box }) =>
        box.x0 >= 0.5 &&
        box.x1 <= width - 0.5 &&
        box.y0 >= 0.5 &&
        box.y1 <= height - 0.5 &&
        !placed.some((other) => overlaps(box, other)) &&
        !nodes.some((other) => touchesCircle(box, other.x, other.y, other.r))
    );
    if (fit) {
      placed.push(fit.box);
      labels.set(node.key, fit.label);
    }
  });

  return labels;
}

interface Body {
  x: number;
  y: number;
  r: number;
  label: string;
}

// Treats every dot as a box that also covers the name under it, and pushes overlapping boxes apart
// along the shorter way out. Keeps everything inside the canvas.
function separate(bodies: Body[], width: number, height: number, passes: number, m: Metrics) {
  const gap = 1.1 * m.scale;
  const nameHeight = m.labelHeight + 0.8;
  const halfWidth = (b: Body) =>
    Math.max(b.r, (clipLabel(b.label, m.maxLabel).length * m.labelChar + 1.2) / 2);
  const halfHeight = (b: Body) => b.r + nameHeight / 2;
  const centreY = (b: Body) => b.y + nameHeight / 2;

  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = centreY(b) - centreY(a);
        const overlapX = halfWidth(a) + halfWidth(b) + gap - Math.abs(dx);
        const overlapY = halfHeight(a) + halfHeight(b) + gap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const shift = overlapX / 2;
          const direction = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
          a.x -= direction * shift;
          b.x += direction * shift;
        } else {
          const shift = overlapY / 2;
          const direction = dy === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy);
          a.y -= direction * shift;
          b.y += direction * shift;
        }
      }
    }
    bodies.forEach((b) => {
      b.x = Math.min(width - halfWidth(b) - 0.5, Math.max(halfWidth(b) + 0.5, b.x));
      b.y = Math.min(height - b.r - nameHeight - 0.5, Math.max(b.r + 0.5, b.y));
    });
  }
}

export interface ConstellationOptions {
  // most technologies drawn
  limit?: number;
  // canvas size in units; a tall canvas with larger names suits a phone
  width?: number;
  height?: number;
  // how large the names are drawn compared with the wide layout (1 = the wide layout)
  textScale?: number;
  maxLabel?: number;
}

// The tall layout for phones: bigger names, fewer technologies, no sideways scrolling
export const COMPACT_CONSTELLATION: ConstellationOptions = {
  limit: 20,
  width: 100,
  height: 132,
  textScale: 1.3,
  maxLabel: 20,
};

// A network of technologies: size = projects using it, lines = used together in a project,
// clusters = the role it belongs to. Laid out by a small force simulation, stretched to fill the
// canvas, with every name placed where it can be read.
export function buildConstellation(
  projects: Project[],
  roles: RoleSet,
  options: ConstellationOptions = {}
): ConstellationData {
  const { limit = 30, width = 100, height = 80, textScale = 1, maxLabel = 20 } = options;
  const m = metricsFor(textScale, maxLabel);
  const centers = clusterCenters(roles, width, height);
  const centerOf = (track: string) => centers.get(track) ?? centers.get('none')!;
  const stats = techStats(projects, roles).slice(0, limit);
  const selected = new Set(stats.map((s) => s.key));

  // co-occurrence weights
  const pairWeights = new Map<string, number>();
  projects.forEach((project) => {
    const keys = Array.from(new Set(project.technologies.map(tagKey)))
      .filter((k) => selected.has(k))
      .sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const id = `${keys[i]}\u0000${keys[j]}`;
        pairWeights.set(id, (pairWeights.get(id) ?? 0) + 1);
      }
    }
  });

  // keep each node's strongest links so the picture stays readable
  const perNode = new Map<string, { id: string; weight: number }[]>();
  pairWeights.forEach((weight, id) => {
    const [a, b] = id.split('\u0000');
    perNode.set(a, [...(perNode.get(a) ?? []), { id, weight }]);
    perNode.set(b, [...(perNode.get(b) ?? []), { id, weight }]);
  });
  const keep = new Set<string>();
  perNode.forEach((links) => {
    links
      .sort((x, y) => y.weight - x.weight || x.id.localeCompare(y.id))
      .slice(0, 3)
      .forEach((l) => keep.add(l.id));
  });
  const edges = Array.from(keep)
    .sort()
    .map((id) => {
      const [a, b] = id.split('\u0000');
      return { a, b, weight: pairWeights.get(id) ?? 1 };
    });

  // force simulation
  const random = mulberry32(1337);
  const dot = Math.sqrt(textScale);
  const nodes = stats.map((stat) => {
    const [cx, cy] = centerOf(stat.track);
    return {
      ...stat,
      x: cx + (random() - 0.5) * 16,
      y: cy + (random() - 0.5) * 16,
      r: (1.9 + 0.85 * stat.count) * dot,
      vx: 0,
      vy: 0,
    };
  });
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const iterations = 420;

  for (let step = 0; step < iterations; step++) {
    const alpha = 1 - step / iterations;
    const fx = new Map<string, number>();
    const fy = new Map<string, number>();
    const push = (key: string, dx: number, dy: number) => {
      fx.set(key, (fx.get(key) ?? 0) + dx);
      fy.set(key, (fy.get(key) ?? 0) + dy);
    };

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.0001) {
          dx = random() - 0.5;
          dy = random() - 0.5;
          d2 = dx * dx + dy * dy + 0.01;
        }
        const d = Math.sqrt(d2);
        // leave room for the name under each dot
        const minimum = a.r + b.r + 5.5 * m.scale;
        let force = Math.min(60 / d2, 3);
        if (d < minimum) force += (minimum - d) * 0.8;
        push(a.key, (dx / d) * force, (dy / d) * force);
        push(b.key, (-dx / d) * force, (-dy / d) * force);
      }
    }

    edges.forEach((edge) => {
      const a = byKey.get(edge.a)!;
      const b = byKey.get(edge.b)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const rest = (15 + (3 - Math.min(edge.weight, 3)) * 2.5) * m.scale;
      const force = (d - rest) * 0.012 * Math.min(edge.weight, 3);
      push(a.key, (dx / d) * force, (dy / d) * force);
      push(b.key, (-dx / d) * force, (-dy / d) * force);
    });

    nodes.forEach((n) => {
      const [cx, cy] = centerOf(n.track);
      push(n.key, (cx - n.x) * 0.02, (cy - n.y) * 0.02);
      n.vx = (n.vx + (fx.get(n.key) ?? 0)) * 0.6;
      n.vy = (n.vy + (fy.get(n.key) ?? 0)) * 0.6;
      n.x += n.vx * (0.25 + 0.75 * alpha);
      n.y += n.vy * (0.25 + 0.75 * alpha);
    });
    separate(nodes, width, height, 2, m);
  }
  // a final settling pass so nothing is left touching
  separate(nodes, width, height, 60, m);

  // stretch the picture so it fills the canvas (positions only: the dots keep their size)
  if (nodes.length > 1) {
    const minX = Math.min(...nodes.map((n) => n.x - n.r));
    const maxX = Math.max(...nodes.map((n) => n.x + n.r));
    const minY = Math.min(...nodes.map((n) => n.y - n.r));
    const maxY = Math.max(...nodes.map((n) => n.y + n.r));
    const padX = 6 * m.scale;
    const padY = 7 * m.scale;
    const sx = Math.max(1, Math.min(1.5, (width - padX * 2) / Math.max(1, maxX - minX)));
    const sy = Math.max(1, Math.min(1.5, (height - padY * 2) / Math.max(1, maxY - minY)));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    nodes.forEach((n) => {
      n.x = width / 2 + (n.x - midX) * sx;
      n.y = height / 2 + (n.y - midY) * sy;
    });
    separate(nodes, width, height, 20, m);
  }

  const rounded = nodes.map(({ vx, vy, ...node }) => {
    void vx;
    void vy;
    return { ...node, x: Math.round(node.x * 100) / 100, y: Math.round(node.y * 100) / 100 };
  });
  const labels = placeLabels(rounded, width, height, m);

  return {
    width,
    height,
    fontSize: m.fontSize,
    scale: m.scale,
    nodes: rounded.map((node) => ({
      ...node,
      labelAt: labels.get(node.key),
      labelled: labels.has(node.key),
    })),
    edges,
  };
}

export interface Kpi {
  label: string;
  value: string;
}

// The numbers in the highlights strip: the ones chosen in the admin, otherwise computed from the content
export function buildKpis(content: PortfolioContent): Kpi[] {
  if (content.siteSettings.highlights.length > 0) return content.siteSettings.highlights;

  const technologies = new Set(content.projects.flatMap((p) => p.technologies.map(tagKey)));
  const kpis: Kpi[] = [
    { label: 'Projects', value: String(content.projects.length) },
    { label: 'Technologies', value: String(technologies.size) },
    { label: 'Certifications', value: String(content.certifications.length) },
  ];
  const cgpa = content.personalInfo.cgpa?.trim();
  if (cgpa && /\d/.test(cgpa)) {
    kpis.push({ label: 'CGPA', value: cgpa });
  } else {
    kpis.push({
      label: 'Skills',
      value: String(content.technicalSkills.reduce((sum, c) => sum + c.skills.length, 0)),
    });
  }
  return kpis.filter((k) => k.value !== '0');
}

// "400+" -> { number: 400, suffix: '+' }, "9.08/10" -> { number: 9.08, decimals: 2, suffix: '/10' }
export function parseCountable(
  value: string
): { prefix: string; number: number; decimals: number; suffix: string } | null {
  const match = value.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const number = Number(match[2]);
  if (!Number.isFinite(number)) return null;
  return {
    prefix: match[1],
    number,
    decimals: match[2].includes('.') ? match[2].split('.')[1].length : 0,
    suffix: match[3],
  };
}
