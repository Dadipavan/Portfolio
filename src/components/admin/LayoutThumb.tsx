// Small wireframe drawings of the looks, for the Appearance page
import type { LayoutId } from '@/lib/types';

const frame = (dark: boolean) => (dark ? '#0f172a' : '#ffffff');
const block = (dark: boolean) => (dark ? '#1e293b' : '#e2e8f0');
const line = (dark: boolean) => (dark ? '#475569' : '#cbd5e1');
const ink = (dark: boolean) => (dark ? '#e2e8f0' : '#334155');
const accent = '#7c3aed';

// The newer looks are drawn in their own colours, so the drawing already says what the look feels like
const BACKGROUND: Partial<Record<LayoutId, string>> = {
  portrait: '#fbf6ee',
  editorial: '#f7f5f0',
  terminal: '#0b0f14',
  classic: '#fbf8f1',
  spotlight: '#09090b',
  aurora: '#f3efff',
  brutal: '#fff6d6',
  notebook: '#e9e2d3',
};

const STICKY_NOTES = [
  { x: 30, y: 66, color: '#ffe66d', turn: -3 },
  { x: 60, y: 68, color: '#ffb3c1', turn: 2 },
  { x: 90, y: 66, color: '#a8e6cf', turn: -1.5 },
];

export default function LayoutThumb({ id }: { id: LayoutId }) {
  const dark = id === 'lab';
  return (
    <svg
      viewBox="0 0 160 100"
      role="img"
      aria-hidden="true"
      className="h-auto w-full rounded-md border border-gray-200"
    >
      <rect width="160" height="100" fill={BACKGROUND[id] ?? frame(dark)} />

      {id === 'dashboard' && (
        <>
          <rect x="0" y="0" width="160" height="10" fill={block(dark)} />
          <rect x="8" y="3.5" width="24" height="3" rx="1.5" fill={ink(dark)} />
          <rect x="8" y="18" width="34" height="3" rx="1.5" fill={accent} />
          <rect x="8" y="25" width="58" height="8" rx="2" fill={ink(dark)} />
          <rect x="8" y="38" width="62" height="3" rx="1.5" fill={line(dark)} />
          <rect x="8" y="44" width="52" height="3" rx="1.5" fill={line(dark)} />
          <rect x="8" y="52" width="22" height="7" rx="2" fill={accent} />
          <rect x="82" y="16" width="70" height="44" rx="3" fill={block(dark)} />
          {[
            [96, 28],
            [112, 40],
            [128, 26],
            [140, 46],
            [104, 50],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3 + (i % 3)}
              fill="none"
              stroke={accent}
              strokeWidth="1.2"
            />
          ))}
          {[8, 46, 84, 122].map((x) => (
            <rect key={x} x={x} y="66" width="32" height="12" rx="2" fill={block(dark)} />
          ))}
          {[8, 46, 84, 122].map((x) => (
            <rect key={x} x={x} y="82" width="32" height="12" rx="2" fill={block(dark)} />
          ))}
        </>
      )}

      {id === 'bento' && (
        <>
          <rect x="6" y="4" width="148" height="8" rx="4" fill={block(dark)} />
          <rect x="6" y="16" width="90" height="42" rx="4" fill={block(dark)} />
          <rect x="12" y="22" width="30" height="3" rx="1.5" fill={accent} />
          <rect x="12" y="29" width="54" height="8" rx="2" fill={ink(dark)} />
          <rect x="12" y="42" width="60" height="3" rx="1.5" fill={line(dark)} />
          <rect x="100" y="16" width="54" height="42" rx="4" fill={block(dark)} />
          {[
            [112, 28],
            [128, 38],
            [142, 26],
            [120, 48],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3 + (i % 2)}
              fill="none"
              stroke={accent}
              strokeWidth="1.2"
            />
          ))}
          {[6, 44, 82, 120].map((x) => (
            <rect key={x} x={x} y="62" width="34" height="14" rx="4" fill={block(dark)} />
          ))}
          <rect x="6" y="80" width="90" height="16" rx="4" fill={block(dark)} />
          <rect x="100" y="80" width="54" height="16" rx="4" fill={block(dark)} />
        </>
      )}

      {id === 'lab' && (
        <>
          <circle cx="40" cy="20" r="34" fill={accent} opacity="0.25" />
          <circle cx="130" cy="70" r="30" fill="#0ea5e9" opacity="0.2" />
          <rect
            x="14"
            y="4"
            width="132"
            height="9"
            rx="4.5"
            fill={block(dark)}
            stroke={line(dark)}
            strokeWidth="0.5"
          />
          <rect x="52" y="22" width="56" height="4" rx="2" fill={accent} />
          <rect x="40" y="31" width="80" height="9" rx="2" fill={ink(dark)} />
          <rect x="48" y="45" width="64" height="3" rx="1.5" fill={line(dark)} />
          <rect x="62" y="53" width="36" height="7" rx="2" fill={accent} />
          <rect
            x="22"
            y="68"
            width="116"
            height="26"
            rx="5"
            fill={block(dark)}
            stroke={line(dark)}
            strokeWidth="0.5"
          />
          {[
            [44, 78],
            [70, 86],
            [96, 76],
            [120, 84],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="none" stroke="#a78bfa" strokeWidth="1.2" />
          ))}
        </>
      )}

      {id === 'split' && (
        <>
          <rect x="0" y="0" width="44" height="100" fill={block(dark)} />
          <rect x="8" y="8" width="10" height="10" rx="3" fill={accent} />
          <rect x="22" y="10" width="16" height="3" rx="1.5" fill={ink(dark)} />
          {[28, 36, 44, 52, 60, 68].map((y) => (
            <rect
              key={y}
              x="8"
              y={y}
              width={y === 28 ? 28 : 24}
              height="4"
              rx="2"
              fill={y === 28 ? accent : line(dark)}
            />
          ))}
          <rect x="56" y="14" width="34" height="3" rx="1.5" fill={accent} />
          <rect x="56" y="22" width="64" height="9" rx="2" fill={ink(dark)} />
          <rect x="56" y="36" width="80" height="3" rx="1.5" fill={line(dark)} />
          <rect x="56" y="43" width="70" height="3" rx="1.5" fill={line(dark)} />
          <rect x="56" y="54" width="92" height="30" rx="3" fill={block(dark)} />
          {[
            [70, 64],
            [90, 74],
            [112, 62],
            [130, 74],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.4" fill="none" stroke={accent} strokeWidth="1.2" />
          ))}
        </>
      )}

      {id === 'story' && (
        <>
          <rect x="0" y="0" width="160" height="12" fill={block(dark)} />
          {[14, 40, 66, 92, 118].map((x, i) => (
            <g key={x}>
              <circle
                cx={x + 4}
                cy="6"
                r="3"
                fill={i < 2 ? accent : 'none'}
                stroke={i < 2 ? accent : line(dark)}
                strokeWidth="1"
              />
              <rect
                x={x + 10}
                y="4.5"
                width="12"
                height="3"
                rx="1.5"
                fill={i === 1 ? ink(dark) : line(dark)}
              />
            </g>
          ))}
          <rect x="10" y="22" width="30" height="3" rx="1.5" fill={accent} />
          <rect x="10" y="30" width="86" height="14" rx="2" fill={ink(dark)} />
          <rect x="10" y="50" width="70" height="3" rx="1.5" fill={line(dark)} />
          <rect x="10" y="58" width="22" height="7" rx="2" fill={accent} />
          <rect x="10" y="74" width="40" height="3" rx="1.5" fill={accent} />
          <rect x="10" y="82" width="64" height="9" rx="2" fill={accent} opacity="0.5" />
          <rect x="96" y="74" width="54" height="20" rx="3" fill={block(dark)} />
        </>
      )}

      {/* Portrait: cream paper, a big arch photo beside the name, soft pill buttons */}
      {id === 'portrait' && (
        <>
          <rect x="8" y="5" width="20" height="3.5" rx="1.75" fill="#2a1f1a" />
          {[88, 100, 112, 124].map((x) => (
            <rect key={x} x={x} y="5.5" width="9" height="2.5" rx="1.25" fill="#d8c9b8" />
          ))}
          <rect x="140" y="4" width="12" height="5" rx="2.5" fill="#b4442a" />
          <rect x="10" y="20" width="26" height="3" rx="1.5" fill="#b4442a" />
          <rect x="10" y="27" width="62" height="9" rx="2" fill="#2a1f1a" />
          <rect x="10" y="39" width="44" height="9" rx="2" fill="#2a1f1a" />
          <rect x="10" y="53" width="64" height="3" rx="1.5" fill="#d8c9b8" />
          <rect x="10" y="59" width="54" height="3" rx="1.5" fill="#d8c9b8" />
          <rect x="10" y="68" width="24" height="8" rx="4" fill="#b4442a" />
          <rect
            x="38"
            y="68"
            width="22"
            height="8"
            rx="4"
            fill="none"
            stroke="#b4442a"
            strokeWidth="0.8"
          />
          <path
            d="M100 66 V40 a24 24 0 0 1 48 0 V66 a3 3 0 0 1 -3 3 H103 a3 3 0 0 1 -3 -3 Z"
            fill="#e9cdb8"
          />
          <circle cx="124" cy="40" r="8" fill="#c98f6c" />
          <path d="M106 69 a18 15 0 0 1 36 0 Z" fill="#8a5a44" />
          {[10, 48, 86, 124].map((x) => (
            <g key={x}>
              <rect x={x} y="82" width="12" height="5" rx="1.5" fill="#2a1f1a" />
              <rect x={x} y="90" width="26" height="2.5" rx="1.25" fill="#d8c9b8" />
            </g>
          ))}
        </>
      )}

      {/* Editorial: a ruled masthead, a headline and standfirst, a portrait, and columns of text */}
      {id === 'editorial' && (
        <>
          <rect x="8" y="5" width="144" height="1.4" fill="#161412" />
          <rect x="8" y="7.8" width="144" height="0.5" fill="#161412" />
          <rect x="58" y="11" width="44" height="6" rx="1" fill="#161412" />
          {[34, 48, 62, 76, 90, 104, 118].map((x) => (
            <rect key={x} x={x} y="21" width="9" height="1.8" rx="0.9" fill="#8a857a" />
          ))}
          <rect x="8" y="26" width="144" height="0.6" fill="#161412" />
          <rect x="8" y="33" width="14" height="2.4" rx="1.2" fill="#a3231f" />
          <rect x="8" y="39" width="84" height="8" rx="1" fill="#161412" />
          <rect x="8" y="50" width="62" height="8" rx="1" fill="#161412" />
          <rect x="8" y="62" width="88" height="2.4" rx="1.2" fill="#8a857a" />
          <rect x="8" y="67" width="80" height="2.4" rx="1.2" fill="#8a857a" />
          <rect x="108" y="32" width="44" height="38" fill="#c9c3b5" />
          <circle cx="130" cy="47" r="7" fill="#9a9487" />
          <path d="M116 70 a14 12 0 0 1 28 0 Z" fill="#9a9487" />
          <rect x="108" y="72" width="30" height="1.8" rx="0.9" fill="#8a857a" />
          {[8, 58, 108].map((x, i) => (
            <g key={x}>
              {[80, 85, 90].map((y) => (
                <rect key={y} x={x} y={y} width={i === 2 ? 40 : 44} height="2" rx="1" fill="#cfc9bc" />
              ))}
              {i > 0 && <rect x={x - 5} y="78" width="0.5" height="18" fill="#161412" />}
            </g>
          ))}
        </>
      )}

      {/* Terminal: editor tabs, a window with prompt lines, two smaller windows */}
      {id === 'terminal' && (
        <>
          <rect x="0" y="0" width="160" height="10" fill="#0d131a" />
          {[6, 38, 66, 96].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y={i === 0 ? 2 : 3}
                width={i === 0 ? 28 : 22}
                height={i === 0 ? 8 : 7}
                fill={i === 0 ? '#0b0f14' : '#131b24'}
              />
              <rect
                x={x + 4}
                y="5"
                width={i === 0 ? 16 : 12}
                height="2"
                rx="1"
                fill={i === 0 ? '#c3ccd5' : '#4b5a6b'}
              />
              {i === 0 && <rect x={x} y="1.4" width="28" height="1" fill="#56d364" />}
            </g>
          ))}
          <rect
            x="8"
            y="16"
            width="144"
            height="46"
            rx="3"
            fill="#0f151c"
            stroke="#2c3a49"
            strokeWidth="0.7"
          />
          <rect x="8" y="16" width="144" height="8" rx="3" fill="#161e28" />
          {[
            [14, '#ff5f56'],
            [20, '#ffbd2e'],
            [26, '#27c93f'],
          ].map(([x, color]) => (
            <circle key={x} cx={x} cy="20" r="1.6" fill={color as string} />
          ))}
          <rect x="48" y="19" width="40" height="2" rx="1" fill="#4b5a6b" />
          <rect x="14" y="30" width="3" height="3" rx="0.6" fill="#56d364" />
          <rect x="20" y="30.2" width="30" height="2.6" rx="1.3" fill="#c3ccd5" />
          <rect x="14" y="37" width="64" height="5" rx="1" fill="#e6edf3" />
          <rect x="14" y="46" width="3" height="3" rx="0.6" fill="#56d364" />
          <rect x="20" y="46.2" width="44" height="2.6" rx="1.3" fill="#c3ccd5" />
          <rect x="67" y="45.8" width="3.6" height="4" fill="#56d364" />
          <rect x="14" y="53" width="70" height="2.2" rx="1.1" fill="#4b5a6b" />
          {[8, 84].map((x) => (
            <g key={x}>
              <rect
                x={x}
                y="68"
                width="68"
                height="26"
                rx="3"
                fill="#0f151c"
                stroke="#2c3a49"
                strokeWidth="0.7"
              />
              <rect x={x} y="68" width="68" height="6" rx="3" fill="#161e28" />
              {[38, 28, 46].map((width, row) => (
                <rect
                  key={row}
                  x={x + 6}
                  y={79 + row * 5}
                  width={width}
                  height="2"
                  rx="1"
                  fill={row === 0 ? '#56d364' : '#4b5a6b'}
                />
              ))}
            </g>
          ))}
        </>
      )}

      {/* Classic: a centred column with fine rules, small-caps headings and CV rows */}
      {id === 'classic' && (
        <>
          <circle cx="80" cy="14" r="7" fill="none" stroke="#1d3a6e" strokeWidth="1" />
          <circle cx="80" cy="12.4" r="2.5" fill="#1d3a6e" opacity="0.5" />
          <path d="M74.2 19.2 a5.8 4.6 0 0 1 11.6 0 Z" fill="#1d3a6e" opacity="0.5" />
          <rect x="52" y="25" width="56" height="5" rx="1" fill="#14284b" />
          <rect x="60" y="33" width="40" height="2" rx="1" fill="#8b93a6" />
          <rect x="30" y="39" width="100" height="0.7" fill="#1d3a6e" />
          <rect x="30" y="41" width="100" height="0.3" fill="#1d3a6e" />
          <rect x="30" y="52" width="30" height="0.5" fill="#cfc8b8" />
          <rect x="68" y="50.5" width="24" height="3" rx="1" fill="#1d3a6e" />
          <rect x="100" y="52" width="30" height="0.5" fill="#cfc8b8" />
          {[60, 72, 84].map((y) => (
            <g key={y}>
              <rect x="30" y={y} width="16" height="2.4" rx="1.2" fill="#8b93a6" />
              <rect x="52" y={y - 0.6} width="44" height="3.4" rx="1" fill="#14284b" />
              <rect x="52" y={y + 5} width="78" height="2" rx="1" fill="#d9d3c4" />
            </g>
          ))}
        </>
      )}

      {/* Spotlight: a dark stage, a glow behind a round photo, a huge name and big numbers */}
      {id === 'spotlight' && (
        <>
          <defs>
            <radialGradient id="thumb-spot-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <clipPath id="thumb-spot-clip">
              <circle cx="118" cy="40" r="19" />
            </clipPath>
          </defs>
          <circle cx="118" cy="40" r="46" fill="url(#thumb-spot-glow)" />
          <rect x="0" y="0" width="160" height="9" fill="#131316" />
          <rect x="8" y="3" width="18" height="3" rx="1.5" fill="#fafafa" />
          <rect x="8" y="22" width="22" height="2.4" rx="1.2" fill="#f59e0b" />
          <rect x="8" y="28" width="70" height="11" rx="1.5" fill="#fafafa" />
          <rect x="8" y="42" width="52" height="11" rx="1.5" fill="#fafafa" />
          <rect x="8" y="58" width="60" height="2.5" rx="1.25" fill="#3f3f46" />
          <rect x="8" y="64" width="22" height="7" rx="3.5" fill="#f59e0b" />
          <circle cx="118" cy="40" r="19" fill="#27272a" />
          <circle cx="118" cy="35" r="6" fill="#52525b" />
          <ellipse cx="118" cy="62" rx="14" ry="12" fill="#52525b" clipPath="url(#thumb-spot-clip)" />
          <circle cx="118" cy="40" r="19" fill="none" stroke="#f59e0b" strokeWidth="1" />
          {[8, 46, 84, 122].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y="80"
                width={[20, 26, 18, 24][i]}
                height="9"
                rx="1.5"
                fill={i === 0 ? '#f59e0b' : '#fafafa'}
              />
              <rect x={x} y="91.5" width="30" height="2" rx="1" fill="#3f3f46" />
            </g>
          ))}
          {[30, 38, 46, 54, 62].map((y, i) => (
            <circle
              key={y}
              cx="155"
              cy={y}
              r={i === 1 ? 1.6 : 1.1}
              fill={i === 1 ? '#f59e0b' : '#52525b'}
            />
          ))}
        </>
      )}

      {/* Aurora: soft gradient light, a ringed photo, frosted panels and a floating dock */}
      {id === 'aurora' && (
        <>
          <defs>
            <linearGradient id="thumb-aurora-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ece6ff" />
              <stop offset="55%" stopColor="#ffe8f5" />
              <stop offset="100%" stopColor="#dff6ff" />
            </linearGradient>
            <linearGradient id="thumb-aurora-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c5cff" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <rect width="160" height="100" fill="url(#thumb-aurora-bg)" />
          <circle cx="30" cy="22" r="26" fill="#7c5cff" opacity="0.25" />
          <circle cx="132" cy="30" r="24" fill="#22d3ee" opacity="0.28" />
          <circle cx="96" cy="84" r="28" fill="#ff7ac8" opacity="0.22" />
          <rect x="8" y="5" width="22" height="5" rx="2.5" fill="#ffffff" opacity="0.75" />
          <rect x="122" y="5" width="30" height="5" rx="2.5" fill="#ffffff" opacity="0.75" />
          <circle cx="80" cy="26" r="13" fill="none" stroke="url(#thumb-aurora-ring)" strokeWidth="2" />
          <circle cx="80" cy="26" r="10.5" fill="#d9d2f7" />
          <circle cx="80" cy="23" r="3.6" fill="#a89be0" />
          <path d="M73 34 a7 6 0 0 1 14 0 Z" fill="#a89be0" />
          <rect x="56" y="43" width="48" height="6" rx="3" fill="#1e1b3a" />
          <rect x="64" y="52" width="32" height="2.4" rx="1.2" fill="#6b6690" />
          <rect x="56" y="58" width="22" height="7" rx="3.5" fill="#5b4bdb" />
          <rect x="82" y="58" width="22" height="7" rx="3.5" fill="#ffffff" opacity="0.8" />
          <rect
            x="14"
            y="70"
            width="132"
            height="14"
            rx="6"
            fill="#ffffff"
            opacity="0.6"
            stroke="#ffffff"
            strokeWidth="0.6"
          />
          {[26, 62, 98].map((x) => (
            <rect key={x} x={x} y="75" width="28" height="4" rx="2" fill="#a89be0" opacity="0.7" />
          ))}
          <rect
            x="48"
            y="88"
            width="64"
            height="9"
            rx="4.5"
            fill="#ffffff"
            opacity="0.85"
            stroke="#d9d2f7"
            strokeWidth="0.5"
          />
          {[58, 68, 78, 88, 98].map((x, i) => (
            <circle key={x} cx={x} cy="92.5" r="2" fill={i === 1 ? '#5b4bdb' : '#b8b0e6'} />
          ))}
        </>
      )}

      {/* Brutalist: thick outlines, hard offset shadows and flat colour blocks */}
      {id === 'brutal' && (
        <>
          <rect x="0" y="10" width="160" height="1.6" fill="#111111" />
          <rect x="6" y="2.5" width="22" height="6" fill="#ffd23f" stroke="#111111" strokeWidth="1" />
          {[50, 70, 90, 110].map((x, i) => (
            <rect
              key={x}
              x={x}
              y="3"
              width="16"
              height="5"
              fill={i === 1 ? '#ff8fb1' : '#ffffff'}
              stroke="#111111"
              strokeWidth="0.8"
            />
          ))}
          <rect x="11" y="23" width="84" height="46" fill="#111111" />
          <rect x="8" y="20" width="84" height="46" fill="#ffffff" stroke="#111111" strokeWidth="1.6" />
          <rect x="14" y="26" width="30" height="4" fill="#ffd23f" stroke="#111111" strokeWidth="0.6" />
          <rect x="14" y="34" width="68" height="9" fill="#111111" />
          <rect x="14" y="46" width="48" height="9" fill="#111111" />
          <rect x="14" y="58" width="22" height="5" fill="#d9381e" stroke="#111111" strokeWidth="0.8" />
          <g transform="rotate(-4 124 42)">
            <rect x="109" y="24" width="40" height="40" fill="#111111" />
            <rect x="106" y="21" width="40" height="40" fill="#ff8fb1" stroke="#111111" strokeWidth="1.6" />
            <circle cx="126" cy="38" r="7" fill="#111111" opacity="0.8" />
            <path d="M112 61 a14 12 0 0 1 28 0 Z" fill="#111111" opacity="0.8" />
          </g>
          {[8, 46, 84, 122].map((x, i) => (
            <g key={x}>
              <rect x={x + 2} y="79" width="30" height="16" fill="#111111" />
              <rect
                x={x}
                y="77"
                width="30"
                height="16"
                fill={['#ffd23f', '#ff8fb1', '#7aa2ff', '#7ee08a'][i]}
                stroke="#111111"
                strokeWidth="1.4"
              />
              <rect x={x + 5} y="82" width="12" height="5" fill="#111111" />
            </g>
          ))}
        </>
      )}

      {/* Notebook: index tabs, a ruled page with a margin and holes, a taped photo and sticky notes */}
      {id === 'notebook' && (
        <>
          {[
            { x: 96, color: '#ffe66d' },
            { x: 112, color: '#ffb3c1' },
            { x: 128, color: '#a8c7fa' },
          ].map((tab) => (
            <rect
              key={tab.x}
              x={tab.x}
              y="3"
              width="14"
              height="9"
              rx="2"
              fill={tab.color}
              stroke="#bfb596"
              strokeWidth="0.4"
            />
          ))}
          <rect
            x="8"
            y="10"
            width="144"
            height="84"
            rx="2.5"
            fill="#fffdf7"
            stroke="#d6cdb5"
            strokeWidth="0.6"
          />
          {[22, 29, 36, 43, 50, 57, 64, 71, 78, 85].map((y) => (
            <rect key={y} x="9" y={y} width="142" height="0.5" fill="#cfd8ea" />
          ))}
          <rect x="24" y="10.5" width="0.8" height="83" fill="#e57373" opacity="0.8" />
          {[20, 48, 76].map((y) => (
            <circle key={y} cx="14" cy={y} r="2" fill="#e9e2d3" stroke="#d6cdb5" strokeWidth="0.4" />
          ))}
          <path
            d="M32 21 q3 -5 6 0 t6 0 t6 0 t6 0 t6 0 t6 0"
            fill="none"
            stroke="#2b4a9a"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <rect x="32" y="29" width="50" height="3" rx="1.5" fill="#26231d" />
          <rect x="32" y="43.5" width="56" height="2.2" rx="1.1" fill="#8b857a" />
          <rect x="32" y="50.5" width="48" height="2.2" rx="1.1" fill="#8b857a" />
          <g transform="rotate(4 120 42)">
            <rect x="102" y="20" width="34" height="40" fill="#ffffff" stroke="#e0d8c4" strokeWidth="0.5" />
            <rect x="105" y="23" width="28" height="28" fill="#cfd5e6" />
            <circle cx="119" cy="34" r="5" fill="#9aa3c4" />
            <path d="M108 51 a11 9 0 0 1 22 0 Z" fill="#9aa3c4" />
            <rect
              x="111"
              y="16"
              width="16"
              height="5"
              fill="#f6e7a1"
              opacity="0.85"
              transform="rotate(-6 119 18)"
            />
          </g>
          {STICKY_NOTES.map((note) => (
            <g key={note.x} transform={`rotate(${note.turn} ${note.x + 12} ${note.y + 10})`}>
              <rect x={note.x} y={note.y} width="24" height="20" fill={note.color} />
              <rect x={note.x + 4} y={note.y + 5} width="12" height="3" rx="1.5" fill="#26231d" opacity="0.8" />
              <rect x={note.x + 4} y={note.y + 11} width="16" height="1.8" rx="0.9" fill="#26231d" opacity="0.4" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
